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

  // helper function to update UI for type selected
  function updateUIForType(type) {
    let placeholder = "";
    let emptyText = "";

    if (type === "crypto") {
      placeholder = "Search crypto (e.g. BTC, ETH)";
      emptyText = "Search for a crypto asset to begin.";
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
});
