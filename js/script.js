(function (global) {
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

var introductionUrl = "pages/introduction.html";
var pluginsUrl = "data/plugins.json";
var demoUrl = "pages/demo.html";
var resourcesURL = "pages/resources.html";
var tipsURL = "pages/tips.html";
var pluginHeaderHtml = "snippets/pluginHeader.html";
var pluginBodyHtml = "snippets/pluginBody.html";
global.$snippets = {};
global.$snippetFiles = [{name: "pluginHeader", url: "snippets/pluginHeader.html"},
                          {name: "pluginBody", url: "snippets/pluginBody.html"},
                          {name: "pluginListHeader", url:"snippets/pluginListHeader.html"},
                          {name: "pluginListBody", url:"snippets/pluginListBody.html"},
                          {name: "links", url:"snippets/links.html"}];

$(initialize);

function initialize() {
  initSnippets();
  refreshPage();
};

//Snippets
function initSnippets(){
  $snippetFiles.forEach(function(info){
    loadSnippet(info.name, info.url)
  });
};

function loadSnippet(name, url) {
  $ajaxUtils.sendGetRequest(url, function (html) {
      $snippets[name] = html;
    }, false);
};

function isSnippetsReady() {
  return $snippetFiles.every(function(fileInfo) {
    return !!$snippets[fileInfo.name];
  });
};

global.addEventListener("hashchange", refreshPage);

function refreshPage(){
  if (!isSnippetsReady()) return setTimeout(refreshPage, 16);

  var hash = global.location.hash;
  switch (hash){
    case "#Introduction":
      showIntroduction();
      switchNavBarActive("introduction-nav");
      break;
    case "#Plugins":
    case "":
    case "#":
      showPlugins();
      switchNavBarActive("plugins-nav");
      break;
    case "#Demo":
      showDemo();
      switchNavBarActive("demo-nav");
      break;
    case "#Resources":
      showResources();
      switchNavBarActive("resources-nav");
      break;
    case "Tips":
      showTips();
      switchNavBarActive("tips-nav");
      break;
    default:
      return;
  }
};

//Introduction Page
function showIntroduction(){
    $ajaxUtils.sendGetRequest(introductionUrl, buildAndShowIntroduction, false);
};

function buildAndShowIntroduction (introduction) {
  var sideHtml = $snippets["links"];
  setHtml('#main-content', introduction); 
  setHtml('#side-list', sideHtml);
}

//Plugin Page
function showPlugins(){
  if (!isSnippetsReady()) return setTimeout(showPlugins, 16);
    $ajaxUtils.sendGetRequest(pluginsUrl, buildAndShowPlugins, true);
};

function buildAndShowPlugins (plugins) {
  var mainHtml = ""
  var sideHtml = ""
  plugins = plugins.sort(function(a,b){return a.name > b.name? 1:-1});
  plugins.forEach(function(plugin){
    mainHtml += buildPluginMainHtml(plugin);
    sideHtml += buildPluginSideHtml(plugin);
  });
  sideHtml = insertProperty($snippets["pluginListHeader"], "body", sideHtml);
  sideHtml += $snippets["links"];
  setHtml('#main-content', mainHtml);
  setHtml('#side-list', sideHtml);
}

function buildPluginMainHtml (plugin) {
  var html = $snippets["pluginHeader"];
  for (property in plugin){
    html = insertProperty(html, property, plugin[property]);
  }
  var body = "";
  plugin.contents.forEach(function (content) {
    var piece = $snippets["pluginBody"];
    piece = insertProperty(piece, "description", content["description"]);
    piece = insertProperty(piece, "image", content["image"]);
    piece = insertProperty(piece, "extra", content["extra"]||"");
    if (content['image']){
      piece = piece.replace(new RegExp('<!--', "g"), "");
      piece = piece.replace(new RegExp('-->', "g"), "");
    }
    body += piece
  })
  html = insertProperty(html, "body", body);
  return html;
}

function buildPluginSideHtml (plugin) {
  var html = $snippets["pluginListBody"];
  for (property in plugin){
    html = insertProperty(html, property, plugin[property]);
  }
  return html;
}

//Demo page
function showDemo(){
    $ajaxUtils.sendGetRequest(demoUrl, buildAndShowDemo, false);
};

function buildAndShowDemo (demo) {
  var sideHtml = $snippets["links"];
  setHtml('#main-content', demo); 
  setHtml('#side-list', sideHtml);
}

//Demo page
function showResources(){
    $ajaxUtils.sendGetRequest(resourcesURL, buildAndShowResources, false);
};

function buildAndShowResources (demo) {
  var sideHtml = $snippets["links"];
  setHtml('#main-content', demo); 
  setHtml('#side-list', sideHtml);
}

//Tip page
function showTips(){
    $ajaxUtils.sendGetRequest(tipsURL, buildAndShowTips, false);
};

function buildAndShowTips (tip) {
  var sideHtml = $snippets["links"];
  setHtml('#main-content', tip); 
  setHtml('#side-list', sideHtml);
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

// function initHandlers(){
//   $("#introduction-nav").click(function (event) {
//     if (!event.target.className.includes("active")) showIntroduction();
//     switchNavBarActive(event.target.id);
//   });
//   $("#plugins-nav").click(function (event) {
//     if (!event.target.className.includes("active")) showPlugins();
//     switchNavBarActive(event.target.id);
//   });
//   $("#demo-nav").click(function (event) {
//     if (!event.target.className.includes("active")) showDemo();
//     switchNavBarActive(event.target.id);
//   });
//   $("#resources-nav").click(function (event) {
//     if (!event.target.className.includes("active")) showResources();
//     switchNavBarActive(event.target.id);
//   });
//   $("#tips-nav").click(function (event) {
//     if (!event.target.className.includes("active")) showTips();
//     switchNavBarActive(event.target.id);
//   });
// };