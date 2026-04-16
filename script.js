$(document).ready(function () {
  // ---------------- NAVIGATION ----------------
  $(".nav button").click(function () {
    $(".nav button").removeClass("active");
    $(this).addClass("active");

    const type = $(this).data("type");
    updateUIForType(type);
  });

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
      `<p class="empty-state">Searching for ${query}...</p>`,
    );

    if (type === "crypto") fetchCrypto(query.toLowerCase());
    if (type === "forex") fetchForex(query);
    if (type === "stocks") fetchStocks(query);
  });

  function updateUIForType(type) {
    if (type === "crypto") {
      $("#search-input").attr(
        "placeholder",
        "Search crypto (e.g. bitcoin, solana)",
      );
      loadTopCrypto();
      return;
    }

    if (type === "forex") {
      $("#search-input").attr("placeholder", "Search forex pair (e.g. EURUSD)");
      loadTopForex();
      return;
    }

    if (type === "stocks") {
      $("#search-input").attr("placeholder", "Search stock symbol (e.g. AAPL)");
      loadTopStocks();
      return;
    }
  }

  // ---------------- CHART GLOW PLUGIN ----------------
  Chart.register({
    id: "shadowLine",
    beforeDraw: (chart) => {
      const ctx = chart.ctx;
      ctx.save();
      ctx.shadowColor = "rgba(139, 92, 246, 0.45)";
      ctx.shadowBlur = 8;
    },
    afterDraw: (chart) => {
      chart.ctx.restore();
    },
  });

  // ---------------- CRYPTO ----------------

  function fetchCrypto(name) {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${name}&vs_currencies=usd&include_24hr_change=true`;

    $.getJSON(url)
      .done(function (data) {
        if (!data[name]) {
          $(".result-container").html(
            `<p class="empty-state">Crypto not found...</p>`,
          );
          return;
        }

        const price = data[name].usd;
        const change = data[name].usd_24h_change;

        renderCryptoCard(name, price, change);
      })
      .fail(() =>
        $(".result-container").html(`<p class="empty-state">API error.</p>`),
      );
  }

  function fetchCryptoHistory(name) {
    const url = `https://api.coingecko.com/api/v3/coins/${name}/market_chart?vs_currency=usd&days=7`;

    return $.getJSON(url).then((data) => data.prices.map((p) => p[1]));
  }

  function renderCryptoCard(name, price, change) {
    const changeClass = change >= 0 ? "green" : "red";

    const card = `
      <div class="card crypto-card">
        <div class="info">
          <h2>${name}</h2>
          <p>Price: $${price}</p>
          <p class="${changeClass}">24h Change: ${change.toFixed(2)}%</p>
        </div>
        <div class="chart">
          <canvas id="chart-${name}"></canvas>
        </div>
      </div>
    `;

    $(".result-container").html(card);

    fetchCryptoHistory(name).then((history) => {
      renderCryptoChart(name, history);
    });
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

        topCoins.forEach((coin) => {
          const price = data[coin].usd;
          const change = data[coin].usd_24h_change;
          const changeClass = change >= 0 ? "green" : "red";

          html += `
            <div class="card crypto-card">
              <div class="info">
                <h2>${coin}</h2>
                <p>Price: $${price}</p>
                <p class="${changeClass}">24h Change: ${change.toFixed(2)}%</p>
              </div>
              <div class="chart">
                <canvas id="chart-${coin}"></canvas>
              </div>
            </div>
          `;
        });

        $(".result-container").html(html);

        topCoins.forEach((coin) => {
          fetchCryptoHistory(coin).then((history) => {
            renderCryptoChart(coin, history);
          });
        });
      })
      .fail(() =>
        $(".result-container").html(
          `<p class="empty-state">Failed to load top cryptos.</p>`,
        ),
      );
  }

  function renderCryptoChart(name, history) {
    const ctx = document.getElementById(`chart-${name}`);

    const isUp = history[history.length - 1] >= history[0];
    const color = isUp ? "#4ade80" : "#f87171";

    new Chart(ctx, {
      type: "line",
      data: {
        labels: history.map((_, i) => i),
        datasets: [
          {
            data: history,
            borderColor: color,
            borderWidth: 1.8,
            tension: 0.4,
            fill: true,
            backgroundColor: (ctx) => {
              const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 80);
              g.addColorStop(
                0,
                isUp ? "rgba(74, 222, 128, 0.25)" : "rgba(248, 113, 113, 0.25)",
              );
              g.addColorStop(1, "rgba(0,0,0,0)");
              return g;
            },
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { point: { radius: 0 } },
      },
    });
  }

  // ---------------- FOREX (unchanged) ----------------
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

    $.getJSON(url)
      .done(function (data) {
        const rate = data.rates[quote];
        if (!rate) {
          $(".result-container").html(
            `<p class="empty-state">Invalid forex pair.</p>`,
          );
          return;
        }

        $(".result-container").html(`
          <div class="card">
            <h2>${base}/${quote}</h2>
            <p>1 ${base} = ${rate.toFixed(4)} ${quote}</p>
          </div>
        `);
      })
      .fail(() =>
        $(".result-container").html(
          `<p class="empty-state">Failed to load forex data.</p>`,
        ),
      );
  }

  function loadTopForex() {
    const topPairs = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD"];
    let html = "";

    topPairs.forEach((pair) => {
      const base = pair.slice(0, 3);
      const quote = pair.slice(3);

      const url = `https://open.er-api.com/v6/latest/${base}`;

      $.getJSON(url).done((data) => {
        const rate = data.rates[quote];
        if (rate) {
          html += `
              <div class="card">
                <h2>${base}/${quote}</h2>
                <p>1 ${base} = ${rate.toFixed(4)} ${quote}</p>
              </div>
            `;
          $(".result-container").html(html);
        }
      });
    });
  }

  // ---------------- STOCKS (still using fake data) ----------------
  function loadTopStocks() {
    const topStocks = ["AAPL", "TSLA", "MSFT", "AMZN", "NVDA"];
    let html = "";

    topStocks.forEach((symbol) => {
      const fake = {
        code: symbol,
        close: (Math.random() * 200 + 50).toFixed(2),
        open: (Math.random() * 200 + 50).toFixed(2),
        high: (Math.random() * 200 + 50).toFixed(2),
        low: (Math.random() * 200 + 50).toFixed(2),
        volume: Math.floor(Math.random() * 50000000),
      };

      html += `
        <div class="card">
          <h2>${fake.code}</h2>
          <p>Price: $${fake.close}</p>
          <p>Open: $${fake.open}</p>
          <p>High: $${fake.high}</p>
          <p>Low: $${fake.low}</p>
          <p>Volume: ${fake.volume.toLocaleString()}</p>
        </div>
      `;
    });

    $(".result-container").html(html);
  }
});
