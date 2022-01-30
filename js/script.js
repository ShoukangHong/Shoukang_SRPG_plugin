(function (global) {

$(function () {
  $("nav>a").click(function (event) {
    switchNavBarActive(event.target.id);
  });
});
// Convenience function for inserting innerHTML for 'select'
var setHtml = function (selector, html) {
  var targetElem = document.querySelector(selector);
  targetElem.innerHTML = html;
};

// Show loading icon inside element identified by 'selector'.
var showLoading = function (selector) {
  var html = "<div class='text-center'>";
  html += "<img src='images/ajax-loader.gif'></div>";
  insertHtml(selector, html);
};

// Return substitute of '{{propName}}'
// with propValue in given 'string'
var insertProperty = function (string, propName, propValue) {
  var propToReplace = "{{" + propName + "}}";
  string = string.replace(new RegExp(propToReplace, "g"), propValue);
  return string;
};

var homeHtmlUrl = "snippets/home-snippet.html";
var pluginsUrl = "data/plugins.json";
var pluginHeaderHtml = "snippets/pluginHeader.html";
var pluginBodyHtml = "snippets/pluginBody.html";
global.$snippets = {};
global._snippetsFiles = [{name: "pluginHeader", url: "snippets/pluginHeader.html"},
                          {name: "pluginBody", url: "snippets/pluginBody.html"},
                          {name: "pluginList", url:"snippets/pluginList.html"}]

// On page load (before images or CSS)
document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
  initSnippets();
  showPlugins();
  switchNavBarActive("plugins-nav")
};

function initSnippets(){
  global._snippetsFiles.forEach(function(info){
    loadSnippet(info.name, info.url)
  });
}

function loadSnippet(name, url) {
  $ajaxUtils.sendGetRequest(url, function (html) {
      global.$snippets[name] = html;
    }, false);
};

function showPlugins(){
  $ajaxUtils.sendGetRequest(pluginsUrl, buildAndShowPlugins, true);
}

function buildAndShowPlugins (plugins) {
  var mainHtml = ""
  var sideHtml = ""
  plugins = plugins.sort(function(a,b){return a.name > b.name? 1:-1});
  plugins.forEach(function(plugin){
    mainHtml += buildPluginMainHtml(plugin);
    sideHtml += buildPluginSideHtml(plugin);
  });
  setHtml('#main-content', mainHtml);
  setHtml('#side-list', sideHtml);
}

function buildPluginMainHtml (plugin) {
  var html = global.$snippets["pluginHeader"];
  for (property in plugin){
    console.log(property)
    html = insertProperty(html, property, plugin[property]);
  }
  var body = "";
  plugin.contents.forEach(function (content) {
    var piece = global.$snippets["pluginBody"];
    for (property in content){
      piece = insertProperty(piece, property, content[property]);
    }
    body += piece
  })
  html = insertProperty(html, "body", body);
  return html;
}

function buildPluginSideHtml (plugin) {
  var html = global.$snippets["pluginList"];
  for (property in plugin){
    html = insertProperty(html, property, plugin[property]);
  }
  return html;
}

var switchNavBarActive = function (id) {
  // Remove 'active' from home button
  var choices = $("nav>a");
  choices.each(function(index, choice){
    choice.className = choice.className.replace(new RegExp("active", "g"), "");
    if (choice.id === id) {
      choice.className += " active";
    }
  });
};

})(window);
