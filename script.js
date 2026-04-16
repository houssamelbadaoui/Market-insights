$(document).ready(function () {
  // 1. Handle tab switching
  $(".nav button").click(function () {
    $(".nav button").removeClass("active");
    $(this).addClass("active");

    const type = $(this).data("type");
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

    if (type === "crypto") fetchCrypto(query);
    if (type === "forex") fetchForex(query);
    if (type === "stocks") fetchStocks(query);
  });

  // UI update helper
  function updateUIForType(type) {
    let placeholder = "";
    let emptyText = "";

    if (type === "crypto") {
      placeholder = "Search crypto (e.g. BTC, ETH)";
      emptyText = "Search for a crypto asset to begin.";
      loadTopCrypto();
      return;
    } else if (type === "forex") {
      placeholder = "Search forex pair (e.g. EURUSD)";
      emptyText = "Search for a forex pair to begin.";
      loadTopForex();
    } else if (type === "stocks") {
      placeholder = "Search stock symbol (e.g. AAPL, TSLA)";
      emptyText = "Search for a stock to begin.";
      loadTopStocks();
    }

    $("#search-input").attr("placeholder", placeholder);
    //$(".result-container").html(`<p class="empty-state">${emptyText}</p>`);
  }

  // ---------------- CRYPTO ----------------

  function fetchCrypto(query) {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${query}&vs_currencies=usd&include_24hr_change=true`;

    $(".result-container").html(`<p class="empty-state">Loading...</p>`);

    $.getJSON(url)
      .done(function (data) {
        if (!data[query]) {
          $(".result-container").html(
            `<p class="empty-state">Crypto not found...</p>`,
          );
          return;
        }

        const price = data[query].usd;
        const change = data[query].usd_24h_change;

        renderCryptoCard(query, price, change);
      })
      .fail(function () {
        console.log("API error.");
      });
  }

  function renderCryptoCard(name, price, change) {
    const card = `
      <div class="card crypto-card">
      <div class="info">
        <h2>${name}</h2>
        <p>Price: $${price}</p>
        <p>24h Change: ${change.toFixed(2)}%</p>
      </div>
      <div class="chart">
        <canvas id="chart-${name}"></canvas>
      </div>
      </div>
    `;
    $(".result-container").html(card);
    const history = generateFakeHistory();
    renderCryptoChart(name, history);
  }

  function loadTopCrypto() {
    const topCoins = ["bitcoin", "ethereum", "solana", "dogecoin"];
    const ids = topCoins.join(",");

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    $(".result-container").html(
      `<p class="empty-state">Loading top cryptos...</p>`,
    );

    $.getJSON(url)
      .done(function (data) {
        let html = "";

        // 1. Build ALL cards first
        topCoins.forEach((coin) => {
          const price = data[coin].usd;
          const change = data[coin].usd_24h_change;
          html += createCryptoCard(coin, price, change);
        });

        // 2. Insert HTML ONCE
        $(".result-container").html(html);

        // 3. Now draw charts
        topCoins.forEach((coin) => {
          const history = generateFakeHistory();
          renderCryptoChart(coin, history);
        });
      })
      .fail(function () {
        $(".result-container").html(
          `<p class="empty-state">Failed to load top cryptos.</p>`,
        );
      });
  }

  function createCryptoCard(name, price, change) {
    return `
      <div class="card crypto-card">
      <div class="info">
        <h2>${name}</h2>
        <p>Price: $${price}</p>
        <p>24h Change: ${change.toFixed(2)}%</p>
      </div>
      <div class="chart">
        <canvas id="chart-${name}"></canvas>
      </div>
      </div>
    `;
  }

  // fake data for the chart
  function generateFakeHistory() {
    const history = [];
    for (let i = 0; i < 20; i++) {
      history.push(100 + Math.random() * 20); // random prices
    }
    return history;
  }

  // function to render the chart using the data
  function renderCryptoChart(name, history) {
    const ctx = document.getElementById(`chart-${name}`);

    new Chart(ctx, {
      type: "line",
      data: {
        labels: history.map((_, i) => i + 1),
        datasets: [
          {
            data: history,
            borderColor: "#8b5cf6",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
      },
    });
  }

  // ---------------- FOREX ----------------

  function fetchForex(query) {
    const pair = query.toUpperCase();

    if (pair.length !== 6) {
      $(".result-container").html(
        `<p class="empty-state">Please enter a 6-letter pair like EURUSD.</p>`,
      );
      return;
    }

    const base = pair.slice(0, 3);
    const quote = pair.slice(3);

    const url = `https://open.er-api.com/v6/latest/${base}`;

    $(".result-container").html(
      `<p class="empty-state">Loading forex rate ...</p>`,
    );

    $.getJSON(url)
      .done(function (data) {
        const rate = data.rates[quote];

        if (!rate) {
          $(".result-container").html(
            `<p class="empty-state">Invalid forex pair.</p>`,
          );
          return;
        }

        renderForexCard(base, quote, rate);
      })
      .fail(function () {
        $(".result-container").html(
          `<p class="empty-state">Failed to load forex data.</p>`,
        );
      });
  }

  function renderForexCard(base, quote, rate) {
    const card = `
      <div class="card">
        <h2>${base}/${quote}</h2>
        <p>1 ${base} = ${rate.toFixed(4)} ${quote}</p>
      </div>
    `;
    $(".result-container").html(card);
  }

  function loadTopForex() {
    const topPairs = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD"];

    $(".result-container").html(
      `<p class="empty-state">Loading top forex pairs...</p>`,
    );

    let html = "";

    topPairs.forEach(function (pair) {
      const base = pair.slice(0, 3);
      const quote = pair.slice(3);

      const url = `https://open.er-api.com/v6/latest/${base}`;

      $.getJSON(url)
        .done(function (data) {
          const rate = data.rates[quote];

          if (rate) {
            html += createForexCard(base, quote, rate);
            $(".result-container").html(html);
          }
        })
        .fail(function () {
          $(".result-container").html(
            `<p class="empty-state">Failed to load top forex pairs.</p>`,
          );
        });
    });
  }

  function createForexCard(base, quote, rate) {
    return `
      <div class="card">
        <h2>${base}/${quote}</h2>
        <p>1 ${base} = ${rate.toFixed(4)} ${quote}</p>
      </div>
    `;
  }

  // ---------------- STOCKS ----------------

  function fetchStocks(query) {
    const symbol = query.toUpperCase();
    const url = `https://eodhd.com/api/real-time/${symbol}.US?api_token=demo`;
    console.log("URL:", url);

    // Loading message
    $(".result-container").html(
      `<p class="empty-state">Loading ${symbol}...</p>`,
    );

    // call $.getJSON()
    $.getJSON(url)
      .done(function (data) {
        console.log(data);

        // validation
        if (!data || !data.close) {
          $(".result-container").html(
            `<p class="empty-state">Stock not found.</p>`,
          );
          return;
        }

        // render the card
        renderStockCard(stock);
      })
      .fail(function () {
        $(".result-container").html(
          `<p class="empty-state">Failed to load stock data.</p>`,
        );
      });
  }

  function renderStockCard(stock) {
    const card = `
    <div class="card">
      <h2>${stock.name} (${stock.symbol})</h2>
      <p>Price: $${stock.price}</p>
      <p>Change: ${stock.change} (${stock.changesPercentage}%)</p>
      <p>High: $${stock.dayHigh}</p>
      <p>Low: $${stock.dayLow}</p>
      <p>Volume: ${stock.volume.toLocaleString()}</p>
    </div>
  `;

    $(".result-container").html(card);
  }

  // function to load top stocks
  function loadTopStocks() {
    const topStocks = ["AAPL", "TSLA", "MSFT", "AMZN", "NVDA"];

    $(".result-container").html(
      `<p class="empty-state">Loading top stocks...</p>`,
    );

    let html = "";

    topStocks.forEach(function (symbol) {
      // For now, we simulate the data until API works
      const fakeData = {
        code: symbol,
        close: (Math.random() * 200 + 50).toFixed(2),
        open: (Math.random() * 200 + 50).toFixed(2),
        high: (Math.random() * 200 + 50).toFixed(2),
        low: (Math.random() * 200 + 50).toFixed(2),
        volume: Math.floor(Math.random() * 50000000),
      };

      html += createStockCard(fakeData);
      $(".result-container").html(html);
    });
  }

  function createStockCard(stock) {
    return `
    <div class="card">
      <h2>${stock.code}</h2>
      <p>Price: $${stock.close}</p>
      <p>Open: $${stock.open}</p>
      <p>High: $${stock.high}</p>
      <p>Low: $${stock.low}</p>
      <p>Volume: ${stock.volume.toLocaleString()}</p>
    </div>
  `;
  }
});
