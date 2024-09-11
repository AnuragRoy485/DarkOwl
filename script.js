document.getElementById("track-btn").addEventListener("click", () => {
  const cryptoType = document.getElementById("crypto-select").value;
  const address = document.getElementById("address").value;

  if (address) {
    if (cryptoType === "btc") {
      fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/full`)
        .then((response) => response.json())
        .then((data) => {
          displayResults("btc", data);
          drawGraph(data);
          drawSankeyDiagram(data);
        })
        .catch((error) => {
          console.error("Error:", error);
          document.getElementById("results").innerHTML =
            '<p class="error">Error fetching Bitcoin data.</p>';
        });
    } else if (cryptoType === "eth") {
      const apiKey = "YOUR_ETHERSCAN_API_KEY"; // Replace with your Etherscan API key
      fetch(
        `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&apikey=${apiKey}`
      )
        .then((response) => response.json())
        .then((data) => {
          displayResults("eth", data);
          drawGraph(data);
          drawSankeyDiagram(data);
        })
        .catch((error) => {
          console.error("Error:", error);
          document.getElementById("results").innerHTML =
            '<p class="error">Error fetching Ethereum data.</p>';
        });
    }
  } else {
    document.getElementById("results").innerHTML =
      '<p class="error">Please enter a wallet address.</p>';
  }
});

function displayResults(cryptoType, data) {
  let resultsHtml = "<h2>Transaction Details</h2>";
  if (cryptoType === "btc") {
    if (data.txs && data.txs.length > 0) {
      resultsHtml += '<div class="transactions">';
      data.txs.forEach((tx) => {
        resultsHtml += `<div class="transaction">
                    <h3>Transaction Hash: ${tx.hash}</h3>
                    <p><strong>Value:</strong> ${tx.total} satoshis</p>
                    <p><strong>Inputs:</strong> ${tx.inputs.length}</p>
                    <p><strong>Outputs:</strong> ${tx.outputs.length}</p>
                    <h4>Outputs:</h4>
                    <ul>`;

        tx.outputs.forEach((output) => {
          resultsHtml += `<li>
                        <strong>Address:</strong> ${
                          output.addresses ? output.addresses.join(", ") : "N/A"
                        }<br>
                        <strong>Value:</strong> ${output.value} satoshis
                    </li>`;
        });

        resultsHtml += `</ul></div>`;
      });
      resultsHtml += "</div>";
    } else {
      resultsHtml += "<p>No transactions found for this address.</p>";
    }
  } else if (cryptoType === "eth") {
    if (data.result && data.result.length > 0) {
      resultsHtml += '<div class="transactions">';
      data.result.forEach((tx) => {
        resultsHtml += `<div class="transaction">
                    <h3>Transaction Hash: ${tx.hash}</h3>
                    <p><strong>Block Number:</strong> ${tx.blockNumber}</p>
                    <p><strong>Value:</strong> ${tx.value / 1e18} ETH</p>
                    <p><strong>From:</strong> ${tx.from}</p>
                    <p><strong>To:</strong> ${tx.to}</p>
                </div>`;
      });
      resultsHtml += "</div>";
    } else {
      resultsHtml += "<p>No transactions found for this address.</p>";
    }
  }
  document.getElementById("results").innerHTML = resultsHtml;
}

function drawGraph(data) {
  const ctx = document.getElementById("transaction-chart").getContext("2d");
  const chartData = {
    labels: [],
    datasets: [
      {
        label: "Transaction Values",
        data: [],
        backgroundColor: "#4e73df",
        borderColor: "#4e73df",
        borderWidth: 1
      }
    ]
  };

  if (data.txs) {
    data.txs.forEach((tx) => {
      chartData.labels.push(tx.hash);
      chartData.datasets[0].data.push(tx.total);
    });
  } else if (data.result) {
    data.result.forEach((tx) => {
      chartData.labels.push(tx.hash);
      chartData.datasets[0].data.push(tx.value / 1e18);
    });
  }

  new Chart(ctx, {
    type: "bar",
    data: chartData,
    options: {
      scales: {
        x: {
          beginAtZero: true
        }
      }
    }
  });
}

function drawSankeyDiagram(data) {
  google.charts.load("current", { packages: ["sankey"] });
  google.charts.setOnLoadCallback(() => {
    const container = document.getElementById("sankey-diagram");
    const chartData = new google.visualization.DataTable();
    chartData.addColumn("string", "From");
    chartData.addColumn("string", "To");
    chartData.addColumn("number", "Value");

    if (data.txs) {
      data.txs.forEach((tx) => {
        tx.outputs.forEach((output) => {
          output.addresses.forEach((address) => {
            chartData.addRow([tx.hash, address, output.value]);
          });
        });
      });
    } else if (data.result) {
      data.result.forEach((tx) => {
        chartData.addRow([tx.from, tx.to, tx.value / 1e18]);
      });
    }

    const chart = new google.visualization.Sankey(chartData);
    chart.draw(container, {
      width: "100%",
      height: 400
    });
  });
}
