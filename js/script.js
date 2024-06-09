// Sticky Navbar
let header = document.querySelector("header");
let menu = document.querySelector("#menu-icon");
let navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {
  header.classList.toggle("shadow", window.scrollY > 0);
});

menu.onclick = () => {
  navbar.classList.toggle("active");
};
window.onscroll = () => {
  navbar.classList.remove("active");
};

$(document).ready(function () {
  $("#menu").click(function () {
    $(this).toggleClass("fa-times");
    $(".navbar").toggleClass("nav-toggle");
  });

  $(window).on("scroll load", function () {
    $("#menu").removeClass("fa-times");
    $(".navbar").removeClass("nav-toggle");
  });

  $(".portfolio .button-container .btn").click(function () {
    let filter = $(this).attr("data-filter");

    if (filter == "all") {
      $(".portfolio .image-container .box").show("400");
    } else {
      $(".portfolio .image-container .box")
        .not("." + filter)
        .hide("200");
      $(".portfolio .image-container .box")
        .filter("." + filter)
        .show("400");
    }
  });

  $("#theme-toggler").click(function () {
    $(this).toggleClass("fa-sun");
    $("body").toggleClass("dark-theme");
  });
});

// Dark Mode
let darkmode = document.querySelector("#darkmode");

darkmode.onclick = () => {
  if (darkmode.classList.contains("bx-moon")) {
    darkmode.classList.replace("bx-moon", "bx-sun");
    document.body.classList.add("active");
  } else {
    darkmode.classList.replace("bx-sun", "bx-moon");
    document.body.classList.remove("active");
  }
};
