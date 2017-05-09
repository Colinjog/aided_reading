function do_load_dictionary(file_text) {
    var lines = file_text.split('\n');
    var rare_words = {};
    var rank = 0;
    var prev_lemma = null;
    for (var i = 0; i < lines.length; ++i) {
        var fields = lines[i].split('\t');
        if (i + 1 === lines.length && fields.length == 1)
            break;
        var form = fields[0];
        var lemma = fields[1];
        if (lemma !== prev_lemma) {
            rank += 1;
            prev_lemma = lemma;
        }
        rare_words[fields[0]] = [fields[1], rank];
    }
    local_storage = chrome.storage.local;
    local_storage.set({"words_discoverer_eng_dict": rare_words});
    local_storage.set({"wd_word_max_rank": rank});
}

function load_eng_dictionary() {
    var file_path = chrome.extension.getURL("eng_dict.txt");
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            do_load_dictionary(xhr.responseText);
        }
    }
    xhr.open('GET', file_path, true);
    xhr.send(null);
}

function do_load_idioms(file_text) {
    var lines = file_text.split('\n');
    var rare_words = {};
    for (var lno = 0; lno < lines.length; ++lno) {
        var fields = lines[lno].split('\t');
        if (lno + 1 === lines.length && fields.length == 1)
            break;
        var words = fields[0].split(' ');
        for (var i = 0; i + 1 < words.length; ++i) {
            key = words.slice(0, i + 1).join(' ');
            rare_words[key] = -1;
        }
        key = fields[0];
        rare_words[key] = fields[1];
    }
    local_storage = chrome.storage.local;
    local_storage.set({"wd_idioms": rare_words});
}

function load_idioms() {
    //FIXME code duplication
    file_path = chrome.extension.getURL("eng_idioms.txt");
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            do_load_idioms(xhr.responseText);
        }
    }
    xhr.open('GET', file_path, true);
    xhr.send(null);
}

function initialize_extension() {

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.wdm_request == "hostname") {
            tab_url = sender.tab.url;
            var url = new URL(tab_url);
            var domain = url.hostname;
            sendResponse({wdm_hostname: domain});
        } else if (request.wdm_verdict) {
            if (request.wdm_verdict == "highlight") {
                chrome.browserAction.setIcon({path: "result48.png", tabId: sender.tab.id});
            } else if (request.wdm_verdict == "keyboard") {
                chrome.browserAction.setIcon({path: "no_dynamic.png", tabId: sender.tab.id});
            } else {
                chrome.browserAction.setIcon({path: "result48_gray.png", tabId: sender.tab.id});
            }
        } else if (request.wdm_new_tab_url) {
            var fullUrl = request.wdm_new_tab_url;
            chrome.tabs.create({'url': fullUrl}, function(tab) { });
        }
    });

    chrome.storage.local.get(['words_discoverer_eng_dict', 'wd_hl_settings', 'wd_online_dicts', 'wd_hover_settings', 'wd_idioms', 'wd_show_percents', 'wd_is_enabled', 'wd_user_vocabulary', 'wd_black_list', 'wd_white_list', 'wd_sync_point'], function(result) {
        load_eng_dictionary();
        load_idioms();
        wd_hl_settings = result.wd_hl_settings;
        if (typeof wd_hl_settings == 'undefined') {
            word_hl_params = {enabled: true, quoted: false, bold: true, useBackground: false, backgroundColor: "rgb(255, 248, 220)", useColor: true, color: "red"};
            idiom_hl_params = {enabled: true, quoted: false, bold: true, useBackground: false, backgroundColor: "rgb(255, 248, 220)", useColor: true, color: "blue"};
            wd_hl_settings = {wordParams: word_hl_params, idiomParams: idiom_hl_params};
            chrome.storage.local.set({"wd_hl_settings": wd_hl_settings});
        }
        wd_hover_settings = result.wd_hover_settings;
        if (typeof wd_hover_settings == 'undefined') {
            wd_hover_settings = {hl_hover: 'always', ow_hover: 'never'};
            chrome.storage.local.set({"wd_hover_settings": wd_hover_settings});
        }
        var wd_sync_point = result.wd_sync_point;
        if (typeof wd_sync_point == 'undefined') {
            wd_sync_point = "http://localhost:8081";
            chrome.storage.local.set({"wd_sync_point": wd_sync_point});
        }
        var wd_online_dicts = result.wd_online_dicts;
        if (typeof wd_online_dicts == 'undefined') {
            wd_online_dicts = make_default_online_dicts();
            chrome.storage.local.set({"wd_online_dicts": wd_online_dicts});
        }
        initContextMenus(wd_online_dicts);

        show_percents = result.wd_show_percents;
        if (typeof show_percents === 'undefined') {
            chrome.storage.local.set({"wd_show_percents": 15});
        }
        wd_is_enabled = result.wd_is_enabled;
        if (typeof wd_is_enabled === 'undefined') {
            chrome.storage.local.set({"wd_is_enabled": true});
        }
        user_vocabulary = result.wd_user_vocabulary;
        if (typeof user_vocabulary === 'undefined') {
            chrome.storage.local.set({"wd_user_vocabulary": {}});
        }
        black_list = result.wd_black_list;
        if (typeof black_list === 'undefined') {
            chrome.storage.local.set({"wd_black_list": {}});
        }
        white_list = result.wd_white_list;
        if (typeof white_list === 'undefined') {
            chrome.storage.local.set({"wd_white_list": {}});
        }
    });
}

initialize_extension();
