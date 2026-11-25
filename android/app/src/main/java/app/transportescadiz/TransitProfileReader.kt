package app.transportescadiz

/** Fixed read profiles. No key enumeration or card writes. */
enum class TransitKeyType { A, B }
interface ReadOnlyTransitCard {
  fun authenticate(sector: Int, key: ByteArray, type: TransitKeyType): Boolean
  fun read(block: Int): ByteArray
  fun reconnect()
}

data class TransitReadProgress(
  val stage: String = "identify-urban",
  val profile: String = "unidentified",
  val urbanIdentityAuthenticated: Boolean? = null,
  val urbanBalanceAuthenticated: Boolean? = null,
  val ctanAuthenticated: Boolean? = null,
  val consistentReads: Boolean = false
)

data class TransitReadResult(val profile: String, val block: ByteArray)
class TransitReadException(val code: String, message: String) : Exception(message)

object TransitProfileReader {
  // Public Proxmark3 entry explicitly labelled Bonobus, Cadiz. Its salted hash
  // matches Metrodroid's Bonobus sector-0 identity: cc2f0d405a4968f95100f776161929f6.
  private fun urbanIdentityKey() = byteArrayOf(0x01,0x72,0x06,0x6B,0x2F,0x03)
  // Independent balance profile, observed in the user-supplied BusCádiz 1.0.59 APK.
  // Sector 4 uses Key B; the sector-0 identity candidate must not be reused.
  private fun urbanBalanceKey() = byteArrayOf(0x2F,0x13,0x01,0x72,0x06,0x6B)
  private fun ctanKey() = byteArrayOf(0x99.toByte(),0x10,0x02,0x25,0xD8.toByte(),0x3B)

  fun read(
    card: ReadOnlyTransitCard,
    isActive: () -> Boolean,
    onProgress: (TransitReadProgress) -> Unit
  ): TransitReadResult {
    var progress = TransitReadProgress()
    fun active() { if (!isActive()) throw TransitReadException("CANCELLED", "Lectura cancelada.") }
    fun update(next: TransitReadProgress) { active(); progress = next; onProgress(progress) }
    update(progress)
    val urban = card.authenticate(0, urbanIdentityKey(), TransitKeyType.A)
    update(progress.copy(urbanIdentityAuthenticated = urban))
    val block: Int
    if (urban) {
      update(progress.copy(profile="bonobus-cadiz", stage="authenticate-urban-balance"))
      val accepted = card.authenticate(4, urbanBalanceKey(), TransitKeyType.B)
      update(progress.copy(urbanBalanceAuthenticated=accepted))
      if (!accepted) throw TransitReadException("URBAN_BALANCE_AUTH_REJECTED", "Bonobús urbano reconocido, pero no se ha podido acceder a su saldo con el perfil de lectura compatible. Comparte el diagnóstico para comprobar esta versión de tarjeta.")
      block = 16
    } else {
      update(progress.copy(stage="reconnect"))
      // Reset the session after the failed identity check, before the other profile.
      card.reconnect()
      update(progress.copy(profile="ctan",stage="authenticate-ctan"))
      val accepted = card.authenticate(9, ctanKey(), TransitKeyType.A)
      update(progress.copy(ctanAuthenticated=accepted))
      if (!accepted) throw TransitReadException("AUTH_REJECTED", "La tarjeta no acepta ninguno de los dos perfiles de lectura compatibles (bonobús urbano y Consorcio). Comparte el diagnóstico; esto no demuestra avería o caducidad.")
      block = 37
    }
    update(progress.copy(stage="read-balance"))
    val first = card.read(block)
    active()
    val second = card.read(block)
    active()
    if (first.size != 16 || second.size != 16) throw TransitReadException("INVALID_BLOCK_LENGTH", "La lectura del saldo está incompleta. Vuelve a acercar la tarjeta.")
    if (!first.contentEquals(second)) throw TransitReadException("INCONSISTENT_READ", "Las dos lecturas no coinciden. Retira la tarjeta y vuelve a acercarla.")
    update(progress.copy(stage="decode",consistentReads=true))
    return TransitReadResult(progress.profile, first)
  }
}
