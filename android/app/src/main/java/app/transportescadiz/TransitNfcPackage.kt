package app.transportescadiz

import android.app.KeyguardManager
import android.content.Context
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.TagLostException
import android.nfc.tech.MifareClassic
import android.nfc.tech.NfcA
import android.os.Build
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.uimanager.ViewManager
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

class TransitNfcPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(TransitNfcModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}

/** Foreground-only, read-only CTAN reader. No discovery intents, service or stored card IDs. */
class TransitNfcModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context), LifecycleEventListener {
  private var requested = false
  @Volatile private var resumed = false
  private val generation = AtomicInteger(0)
  private val busy = AtomicBoolean(false)
  private val timer = Executors.newSingleThreadScheduledExecutor()
  @Volatile private var connection: MifareClassic? = null
  private var lastId = ""
  private var lastAt = 0L
  init { context.addLifecycleEventListener(this) }
  override fun getName() = "TransitNfc"
  override fun getConstants(): Map<String, Any> = mapOf("deviceLanguage" to java.util.Locale.getDefault().toLanguageTag())
  @ReactMethod fun getDeviceLocale(promise: Promise) { promise.resolve(java.util.Locale.getDefault().toLanguageTag()) }
  private fun adapter() = NfcAdapter.getDefaultAdapter(context)
  @ReactMethod fun addListener(name: String) {}
  @ReactMethod fun removeListeners(count: Double) {}
  @ReactMethod fun getStatus(promise: Promise) {
    val adapter = adapter()
    promise.resolve(if (adapter == null) "unavailable" else if (adapter.isEnabled) "ready" else "disabled")
  }
  @ReactMethod fun setActive(active: Boolean) {
    UiThreadUtil.runOnUiThread { requested = active; update() }
  }
  private fun update() {
    val activity = currentActivity ?: return
    val nfc = adapter() ?: return
    stopReading()
    val locked = (context.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager).isKeyguardLocked
    if (requested && resumed && !locked && nfc.isEnabled) {
      val session = generation.get()
      try { nfc.enableReaderMode(activity, { tag -> read(tag, session) }, NfcAdapter.FLAG_READER_NFC_A or NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK, null) }
      catch (_: Exception) { emit(session, "error", "No se pudo activar el lector NFC.") }
    }
  }
  @Synchronized private fun stopReading() {
    generation.incrementAndGet()
    try { currentActivity?.let { adapter()?.disableReaderMode(it) } } catch (_: Exception) {}
    try { connection?.close() } catch (_: Exception) {}
    connection = null
  }
  private fun emit(session: Int, status: String, message: String? = null, bytes: ByteArray? = null, diagnostic: WritableMap? = null) {
    if (!resumed || session != generation.get() || !context.hasActiveReactInstance()) return
    val data = Arguments.createMap().apply {
      putString("status", status)
      diagnostic?.let { putMap("diagnostic", it) }
      message?.let { putString("message", it) }
      bytes?.let { b -> putArray("block", Arguments.createArray().apply { b.forEach { pushInt(it.toInt() and 255) } }) }
    }
    context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit("TransitCard", data)
  }
  private fun read(tag: Tag, session: Int) {
    if (!resumed || session != generation.get() || !busy.compareAndSet(false, true)) return
    val id = tag.id.contentHashCode().toString()
    val now = android.os.SystemClock.elapsedRealtime()
    if (id == lastId && now-lastAt < 2500) { busy.set(false); return }
    lastId = id; lastAt = now
    var card: MifareClassic? = null
    var timeout: java.util.concurrent.ScheduledFuture<*>? = null
    val expired = AtomicBoolean(false)
    var stage = "detect"
    var connected = false
    var progress = TransitReadProgress()
    fun diagnostic(code: String, exception: Exception? = null): WritableMap = Arguments.createMap().apply {
      putString("readerRevision", "nfc-diag-3")
      putString("profile", progress.profile)
      progress.urbanIdentityAuthenticated?.let { putBoolean("urbanIdentityAuthenticated", it) }
      progress.urbanBalanceAuthenticated?.let { putBoolean("urbanBalanceAuthenticated", it) }
      progress.ctanAuthenticated?.let { putBoolean("ctanAuthenticated", it) }
      putBoolean("consistentReads", progress.consistentReads)
      putString("manufacturer", Build.MANUFACTURER)
      putString("model", Build.MODEL)
      putString("android", Build.VERSION.RELEASE)
      putInt("sdk", Build.VERSION.SDK_INT)
      putString("stage", stage)
      putString("code", code)
      putDouble("elapsedMs", (android.os.SystemClock.elapsedRealtime()-now).toDouble())
      putBoolean("connected", connected)
      putBoolean("authenticated", if (progress.profile == "bonobus-cadiz") progress.urbanBalanceAuthenticated == true else progress.ctanAuthenticated == true)
      putArray("technologies", Arguments.createArray().apply { tag.techList.forEach { pushString(it.substringAfterLast('.')) } })
      NfcA.get(tag)?.let { a ->
        putInt("sak", a.sak.toInt() and 65535)
        putString("atqa", a.atqa.joinToString("") { "%02X".format(it.toInt() and 255) })
      }
      card?.let { c -> putInt("classicSize", c.size); putInt("sectorCount", c.sectorCount) }
      exception?.let { putString("exception", it.javaClass.simpleName) }
    }
    try {
      card = MifareClassic.get(tag)
      if (card == null) {
        emit(session,"error","El teléfono detecta la tarjeta, pero no ofrece acceso MIFARE Classic. Abre el diagnóstico para comprobar su tecnología.", diagnostic=diagnostic("CLASSIC_UNAVAILABLE")); return
      }
      synchronized(this) {
        if (session != generation.get() || !resumed) return
        connection = card
      }
      val target = card
      timeout = timer.schedule({ expired.set(true); try { target.close() } catch (_: Exception) {} }, 8, TimeUnit.SECONDS)
      emit(session,"reading", diagnostic=diagnostic("DETECTED"))
      stage = "connect"
      card.connect()
      connected = true
      if (!resumed || session != generation.get()) return
      val result = TransitProfileReader.read(
        object : ReadOnlyTransitCard {
          override fun authenticate(sector: Int, key: ByteArray, type: TransitKeyType) =
            when (type) {
              TransitKeyType.A -> target.authenticateSectorWithKeyA(sector, key)
              TransitKeyType.B -> target.authenticateSectorWithKeyB(sector, key)
            }
          override fun read(block: Int) = target.readBlock(block)
          override fun reconnect() { target.close(); target.connect() }
        },
        isActive = { resumed && session == generation.get() && !expired.get() },
        onProgress = { next -> progress = next; stage = next.stage }
      )
      emit(session,"read",bytes=result.block,diagnostic=diagnostic("BLOCK_READ"))

    } catch (error: Exception) {
      val code = if (expired.get()) "TIMEOUT" else if (error is TagLostException) "TAG_LOST" else if (error is TransitReadException) error.code else "IO_ERROR"
      val message = when (code) {
        "TIMEOUT" -> "Se agotaron los ocho segundos de lectura. Retira la tarjeta y vuelve a acercarla."
        "TAG_LOST" -> "Se perdió la conexión con la tarjeta. Mantenla quieta y fuera de la cartera."
        else -> if (error is TransitReadException) error.message else "Falló la comunicación NFC durante la fase $stage. El diagnóstico indica el punto exacto."
      }
      emit(session,"error",message,diagnostic=diagnostic(code,error))
    } finally { timeout?.cancel(false); try { card?.close() } catch (_: Exception) {}; connection = null; busy.set(false) }
  }

  override fun onHostResume() { resumed = true; update() }
  override fun onHostPause() { resumed = false; synchronized(this) { stopReading() } }
  override fun onHostDestroy() { resumed = false; stopReading() }
  override fun invalidate() { requested = false; resumed = false; stopReading(); timer.shutdownNow(); context.removeLifecycleEventListener(this); super.invalidate() }
}
