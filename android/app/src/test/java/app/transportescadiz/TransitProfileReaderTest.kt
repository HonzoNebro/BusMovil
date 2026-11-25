package app.transportescadiz

import org.junit.Assert.*
import org.junit.Test
import java.security.MessageDigest

class TransitProfileReaderTest {
  private class Card(private val accepted: Set<Int>, private val differingReads: Boolean = false) : ReadOnlyTransitCard {
    val calls = mutableListOf<String>()
    val keys = mutableMapOf<Int, ByteArray>()
    var reads = 0
    override fun authenticate(sector: Int, key: ByteArray, type: TransitKeyType): Boolean {
      calls.add("auth:$sector:$type"); keys[sector] = key.clone()
      val expectedType = if (sector == 4) TransitKeyType.B else TransitKeyType.A
      return accepted.contains(sector) && type == expectedType
    }
    override fun read(block: Int): ByteArray {
      calls.add("read:$block"); reads++
      return ByteArray(16).apply { this[0] = if (differingReads) reads.toByte() else 100 }
    }
    override fun reconnect() { calls.add("reconnect") }
  }

  @Test fun urbanIdentityAAndSeparateBalanceBReadOnlyTheBalanceBlock() {
    val card = Card(setOf(0,4)); var last = TransitReadProgress()
    val result = TransitProfileReader.read(card,{ true },{ last = it })
    assertEquals("bonobus-cadiz",result.profile)
    assertEquals(listOf("auth:0:A","auth:4:B","read:16","read:16"),card.calls)
    assertTrue(last.consistentReads)
    assertFalse(card.keys.getValue(0).contentEquals(card.keys.getValue(4)))
    assertArrayEquals(byteArrayOf(47,19,1,114,6,107), card.keys.getValue(4))
    // Validate the one public Cádiz candidate against Metrodroid's salted identity hash.
    val salt="cadiz".toByteArray(Charsets.US_ASCII)
    val hash=MessageDigest.getInstance("MD5").digest(salt+card.keys.getValue(0)+salt).joinToString("") { "%02x".format(it.toInt() and 255) }
    assertEquals("cc2f0d405a4968f95100f776161929f6",hash)
  }
  @Test fun ctanRemainsAvailableAfterAnExplicitReconnect() {
    val card = Card(setOf(9))
    val result = TransitProfileReader.read(card,{ true },{})
    assertEquals("ctan",result.profile)
    assertEquals(listOf("auth:0:A","reconnect","auth:9:A","read:37","read:37"),card.calls)
  }
  @Test fun recognizedUrbanCardDoesNotFallThroughToAnotherFormatIfBalanceAuthFails() {
    val card=Card(setOf(0,9))
    val error=assertThrows(TransitReadException::class.java) { TransitProfileReader.read(card,{true},{}) }
    assertEquals("URBAN_BALANCE_AUTH_REJECTED",error.code)
    assertEquals(listOf("auth:0:A","auth:4:B"),card.calls)
  }
  @Test fun unknownCardCannotProduceBalanceBytes() {
    val card=Card(emptySet())
    val error=assertThrows(TransitReadException::class.java) { TransitProfileReader.read(card,{true},{}) }
    assertEquals("AUTH_REJECTED",error.code);assertEquals(0,card.reads)
  }
  @Test fun differentConsecutiveReadsAreRejected() {
    val error=assertThrows(TransitReadException::class.java) { TransitProfileReader.read(Card(setOf(0,4),true),{true},{}) }
    assertEquals("INCONSISTENT_READ",error.code)
  }
  @Test fun pauseAfterFirstReadPreventsSecondReadAndResult() {
    val card=Card(setOf(0,4))
    val error=assertThrows(TransitReadException::class.java) { TransitProfileReader.read(card,{card.reads == 0},{}) }
    assertEquals("CANCELLED",error.code);assertEquals(1,card.reads)
  }
}
