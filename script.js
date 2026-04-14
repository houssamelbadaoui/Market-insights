$(document).ready(function () {
  // 1. Handle tab switching
  $(".nav button").click(function () {
    // remove the class active from all
    $(".nav button").removeClass("active");
    // add active to clicked
    $(this).addClass("active");
    // read data type
    const type = $(this).data("type");
    // Update placeholder + emty state
    updateUIForType(type);
  });

  // search logic
  $("#search-btn").click(function () {
    const type = $(".nav .active").data("type");
    const query = $("#search-input").val().trim();

    if (!query) {
      $(".result-container").html(
        `<p class="empty-state">Please enter a value to search.</p>`,
      );
      return;
    }
    $(".result-container").html(
      `<p class="empty-state">Searching for ${query} ...</p>`,
    );

    // call the correct API based on type
    if (type === "crypto") {
      fetchCrypto(query);
    }
  });

  // helper function to update UI for type selected
  function updateUIForType(type) {
    let placeholder = "";
    let emptyText = "";

    if (type === "crypto") {
      placeholder = "Search crypto (e.g. BTC, ETH)";
      emptyText = "Search for a crypto asset to begin.";
      loadTopCrypto();
    } else if (type === "forex") {
      placeholder = "Search forex pair (e.g. EURUSD)";
      emptyText = "Search for a forex pair to begin.";
    } else if (type === "stocks") {
      placeholder = "Search stock symbol (e.g. AAPL, TSLA)";
      emptyText = "Search for a stock to begin.";
    }

    // update placeholder
    $("#search-input").attr("placeholder", placeholder);

    // update empty state
    $(".result-container").html(`<p class="empty-state">${emptyText}</p>`);
  }

  // function to fetch crypro
  function fetchCrypto(query) {
    // build URL
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${query}&vs_currencies=usd&include_24hr_change=true`;

    // show loading
    $(".result-container").html(`<p class="empty-state">Loading...</p>`);
    // call $.getJSON
    $.getJSON(url)
      .done(function (data) {
        // if invalid or not found
        if (!data[query]) {
          $(".result-container").html(
            `<p class="empty-state">Crypto not found...</p>`,
          );
        }
        // extract the values
        const price = data[query].usd;
        const change = data[query].usd_24h_change;
        // on sucess => render card
        renderCryptoCard(query, price, change);
      })
      // on error => show error message
      .fail(function () {
        // error
        console.log("API error.");
      });
  }

  // helper function to render crypto card
  function renderCryptoCard(name, price, change) {
    const card = `
    <div class="card">
      <h2>${name}</h2>
      <p>Price: $${price}</p>
      <p>24h Change: ${change.toFixed(2)}%</p>
    </div>
  `;
    $(".result-container").html(card);
  }

  // Helper function to load Top crypto when crypto button is clicked
  function loadTopCrypto() {
    // Define the list of cryptos
    const topCoins = ["bitcoin", "ethereum", "solana", "dogecoin"];
    const ids = topCoins.join(",");

    // build the URL
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    // Show loading
    $(".result-container").html(
      `<p class="empty-state">Loading top cryptos...</p>`,
    );
    // $.getJSON
    $.getJSON(url)
      .done(function (data) {
        // loop and build cards
        let html = "";

        for (let coin in data) {
          const price = data[coin].usd;
          const change = data[coin].usd_24h_change;
          html += createCryptoCard(coin, price, change);
        }
        $(".result-container").html(html);
      })
      .fail(function () {
        $(".result-container").html(
          `<p class="empty-state">Failed to load top cryptos.</p>`,
        );
      });
  }

  // helper function that return  a card string
  function createCryptoCard(name, price, change) {
    return `
    <div class="card">
      <h2>${name}</h2>
      <p>Price: $${price}</p>
      <p>24h Change: ${change.toFixed(2)}%</p>
    </div>
  `;
  }
});
