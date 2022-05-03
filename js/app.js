// URLs for testing varius scenarios:
// success: doc.html#e4142e56e449251d27732d585248d507994e400fc19184ce6158f1263cdc9e1a
// success and expired: doc.html#0xe4142e56e449251d27732d585248d507994e400fc19184ce6158f1263cdc9e11
// error: doc.html#0xe4142e56e449251d27732d585248d507994e400fc19184ce6158f1263cdc9e1 // FIXME: show error message
// fail: doc.html#0xe4142e56e449251d27732d585248d507994e400fc19184ce6158f1263cdc9e1f
//*
const loadElement = document.querySelector('.load')
const successfulElement = document.querySelector('.successful')
const failedElement = document.querySelector('.failed')

async function validate() {
  showLoad()

  try {
    let docHash = location.hash.replace("#", "")
    docHash = "0x" + docHash.replace("0x", "")

    const polyscanApi = new PolyscanApi()
    let result = await polyscanApi.fetch(docHash);

    if (result) {
      const {txHash, timeStamp, newDocVersionTxHash, newDocVersionHash, validUntilTimeStamp} = result

      showSuccessful()

      let txHashElement = document.getElementById("tx-hash");
      txHashElement.innerHTML = `<a class="hash-link" href="https://polygonscan.com/tx/${txHash}" target="_blank">${txHash}</a>`

      let timeElement = document.getElementById("timestamp");
      let date = new Date(timeStamp * 1000);
      timeElement.innerText = date

      let validUntilTimeStampElement = document.getElementById("valid_until_timestamp");
      validUntilTimeStampElement.innerText = validUntilTimeStamp
          ? new Date(validUntilTimeStamp * 1000).toString()
          : 'Unlimited';

      const text = document.querySelector('.info__text_time')
      text.textContent = date

      // let blockHashElement = document.getElementById("block-hash");
      // blockHashElement.innerText = blockHash

      let docHashElement = document.getElementById("doc-hash");
      docHashElement.innerText = docHash

      if (newDocVersionTxHash) {
        // change color of central text block to pink instead green
        showSuccessful()
        const textBlock = document.querySelector('.information')
        textBlock.style.background = '#d38e3e'
      }
    } else {
      showFailed()
    }
  } catch (e) {
    console.log(e)
    showFailed() // TODO: showError()
  }
}
validate();

window.onhashchange = function() {
  validate();
}

function showSuccessful() {
  successfulElement.style.display = 'block'
  loadElement.style.display = 'none'
  failedElement.style.display = 'none'
}

function showFailed() {
  failedElement.style.display = 'block'
  loadElement.style.display = 'none'
  successfulElement.style.display = 'none'
}

function showLoad() {
  loadElement.style.display = 'block'
  failedElement.style.display = 'none'
  successfulElement.style.display = 'none'
}
//*/


/*
//TESTS

const polyscanApi = new PolyscanApi()

// new version exist scenario:
polyscanApi.fetch("0xe4142e56e449251d27732d585248d507994e400fc19184ce6158f1263cdc9e12").then(({txHash, timeStamp}) => {
  console.assert(txHash === "0x96ab44536ef95ac5720cebeeb00b874947ea03204b6ff89eafb141a616ebe849", "Invalid transaction HASH")
  console.assert(timeStamp === 1646583621, "Invalid time")
})

// new version exist scenario:
polyscanApi.fetch("0xe4142e56e449251d27732d585248d507994e400fc19184ce6158f1263cdc9e11")
    .then(({txHash, timeStamp, newDocVersionTxHash, newDocVersionHash, newDocVersionTimeStamp}) => {
      console.assert(txHash === "0x3b18c87703bd71721e419cd62843227dfe586380adfc6c40c5c511280bb3233b", "Invalid transaction HASH")
      console.assert(timeStamp === 1646583547, "Invalid time")
      console.assert(newDocVersionTimeStamp === 1646583621, "Invalid time")
      console.assert(newDocVersionTxHash === "0x96ab44536ef95ac5720cebeeb00b874947ea03204b6ff89eafb141a616ebe849", "Invalid transaction  HASH")
      console.assert(newDocVersionHash === "0xe4142e56e449251d27732d585248d507994e400fc19184ce6158f1263cdc9e12", "Invalid doc HASH")
    })

// no data scenario:
polyscanApi.fetch("0xe4142e56e449251d27732d585248d507994e400fc19184ce6158f1263cdc9e13").then( result => {
  console.assert(result === null, "Should be null")
})

// error scenario:
polyscanApi.fetch("0xe4142e56e449251d27732d585248d507994e400fc19184ce6158f1263cdc9e1").then( result => {
  console.assert(result === null, "Should be null")
})
//*/

function PolyscanApi() {
  /**
   * https://docs.polygonscan.com/api-endpoints/logs
   *
   * @param docHash
   * @param topicIndex
   * @returns {Promise<null|*>}
   */
  const fetchLogs = async (docHash, topicIndex) => {
    const API_KEY = atob('RUFVR1FLRDdFNUhIUVI1UFFaTUNRQkQ2VlRKQlNURUhRNQ==')
    const registeredTopic = "0xc8704a622f3eb8c9fc5a2ddf1775b5ea7695359b13dec8111874e266a4d5fbc9"
    const registeredNewVersionTopic = "0xb5dac8ad49578955a20b2a5179573fe2be183efb3659e0daded600bd59b3975e"
    const topic0 = topicIndex === 1 ? registeredTopic : registeredNewVersionTopic
    // fixme: check for correct smart contract which is emit this event
    let response = await fetch(`https://api.polygonscan.com/api?module=logs&action=getLogs&topci0=${topic0}&topic${topicIndex}=${docHash}&apikey=${API_KEY}`)
        .then(response => response.json())

    if (response.status !== "1") {
      return null
    }

    return response.result[0]
  }
  /**
   * Check for NewVersionRegistered transactions. topic2 parameter used according to event signature:
   * event NewVersionRegistered(bytes32 indexed docHash, bytes32 indexed expiredDocHash);
   * expiredDocHash = topic2
   *
   * @param docHash
   * @returns {Promise<{newDocVersionHash: *, txHash: *}>}
   */
  const fetchNewVersionRegisteredLogs = async (docHash) => {
    let result = await fetchLogs(docHash, 2)

    return result ? {
      txHash: result.transactionHash,
      newDocVersionHash: result.topics[1],
      timeStamp: Number(result.timeStamp)
    } : null
  }

  /**
   * Fetch transaction info for Registered event for doc hash
   *
   * @param docHash
   * @returns {Promise<{txHash: *}|null>}
   */
  const fetchRegisteredLogs = async (docHash) => {
    let result = await fetchLogs(docHash, 1)
    return result ? {
      txHash: result.transactionHash,
      timeStamp: Number(result.timeStamp),
      validUntilTimeStamp: Number(result.topics[2])
    } : null
  }

  this.fetch = async (docHash) => {
    const registered = await fetchRegisteredLogs(docHash)
    if (!registered) {
      return null
    }

    // check for NewVersionRegistered. If log exist new version of document published
    const newVersion = await fetchNewVersionRegisteredLogs(docHash)
    if (newVersion) {
      // new version of current document exist
      return {
        ...registered,
        newDocVersionTxHash: newVersion.txHash,
        newDocVersionHash: newVersion.newDocVersionHash,
        newDocVersionTimeStamp: newVersion.timeStamp,
      }
    } else {
      return registered
    }
  }
}
