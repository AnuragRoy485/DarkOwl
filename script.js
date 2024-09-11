document.getElementById('track-btn').addEventListener('click', () => {
    const cryptoType = document.getElementById('crypto-select').value;
    const address = document.getElementById('address').value;

    if (address) {
        if (cryptoType === 'btc') {
            fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/full`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Bitcoin data:', data); // Debugging line
                    if (data && Array.isArray(data.txs)) {
                        displayResults('btc', data);
                        trackFunds('btc', data);
                    } else {
                        throw new Error('Unexpected data structure or no transactions found.');
                    }
                })
                .catch(error => {
                    console.error('Error fetching Bitcoin data:', error);
                    document.getElementById('results').innerHTML = '<p class="error">Error fetching Bitcoin data: ' + error.message + '</p>';
                });
        } else if (cryptoType === 'eth') {
            const apiKey = 'AENRRI4JUYH3U2GK1Z4IVVK7JSR43M5G9A'; // Replace with your Etherscan API key
            fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&apikey=${apiKey}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Ethereum data:', data); // Debugging line
                    if (data && data.result && Array.isArray(data.result)) {
                        displayResults('eth', data);
                        trackFunds('eth', data);
                    } else {
                        throw new Error('Unexpected data structure or no transactions found.');
                    }
                })
                .catch(error => {
                    console.error('Error fetching Ethereum data:', error);
                    document.getElementById('results').innerHTML = '<p class="error">Error fetching Ethereum data: ' + error.message + '</p>';
                });
        }
    } else {
        document.getElementById('results').innerHTML = '<p class="error">Please enter a wallet address.</p>';
    }
});

function displayResults(cryptoType, data) {
    let resultsHtml = '<h2>Transaction Details</h2>';
    if (cryptoType === 'btc') {
        if (data.txs && data.txs.length > 0) {
            resultsHtml += '<div class="transactions">';
            data.txs.forEach(tx => {
                resultsHtml += `<div class="transaction">
                    <h3>Transaction Hash: ${tx.hash}</h3>
                    <p><strong>Value:</strong> ${tx.total} satoshis</p>
                    <p><strong>Inputs:</strong> ${tx.inputs.length}</p>
                    <p><strong>Outputs:</strong> ${tx.outputs.length}</p>
                </div>`;
            });
            resultsHtml += '</div>';
        } else {
            resultsHtml += '<p>No transactions found for this address.</p>';
        }
    } else if (cryptoType === 'eth') {
        if (data.result && data.result.length > 0) {
            resultsHtml += '<div class="transactions">';
            data.result.forEach(tx => {
                resultsHtml += `<div class="transaction">
                    <h3>Transaction Hash: ${tx.hash}</h3>
                    <p><strong>Block Number:</strong> ${tx.blockNumber}</p>
                    <p><strong>Value:</strong> ${tx.value / 1e18} ETH</p>
                    <p><strong>From:</strong> ${tx.from}</p>
                    <p><strong>To:</strong> ${tx.to}</p>
                </div>`;
            });
            resultsHtml += '</div>';
        } else {
            resultsHtml += '<p>No transactions found for this address.</p>';
        }
    }
    document.getElementById('results').innerHTML = resultsHtml;
}

function trackFunds(cryptoType, data) {
    const addressMap = new Map();
    const transactions = [];

    if (cryptoType === 'btc') {
        data.txs.forEach(tx => {
            if (tx.outputs) {
                tx.outputs.forEach(output => {
                    if (output.addresses) {
                        output.addresses.forEach(address => {
                            addressMap.set(address, (addressMap.get(address) || 0) + output.value);
                        });
                    }
                });
            }
        });
    } else if (cryptoType === 'eth') {
        data.result.forEach(tx => {
            const value = tx.value / 1e18;
            addressMap.set(tx.to, (addressMap.get(tx.to) || 0) + value);
        });
    }

    const endReceivers = Array.from(addressMap.entries());
    endReceivers.sort((a, b) => b[1] - a[1]); // Sort by received amount in descending order
    displayEndReceivers(endReceivers);
}

function displayEndReceivers(endReceivers) {
    let resultsHtml = '<h2>End Receivers</h2>';
    if (endReceivers.length > 0) {
        resultsHtml += '<div class="end-receivers">';
        endReceivers.forEach(([address, amount]) => {
            resultsHtml += `<div class="end-receiver">
                <p><strong>Address:</strong> ${address}</p>
                <p><strong>Total Received:</strong> ${amount} ${address.startsWith('0x') ? 'ETH' : 'satoshis'}</p>
            </div>`;
        });
        resultsHtml += '</div>';
    } else {
        resultsHtml += '<p>No end receivers found.</p>';
    }
    document.getElementById('results').innerHTML += resultsHtml;
}
