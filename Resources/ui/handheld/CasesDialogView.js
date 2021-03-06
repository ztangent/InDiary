var CasesDialogView = function(value, hintText, recentPropName){
    var util = require('util');
    var db = require('db');
    var theme = require('ui/theme');
    var ToolbarView = require('ToolbarView');
    var DynamicTableView = require('DynamicTableView');
    var DataWin = require('DataWin');
    
    var dialogView = Ti.UI.createView({
        height : Ti.UI.SIZE,
        layout : 'vertical',
        backgroundColor: theme.backgroundColor,
        value : value
    });

    var validCaseId = typeof(value) == 'number' && value > 0;

    var toolbarView = new ToolbarView();
    toolbarView.backgroundColor = theme.backgroundColor;
    dialogView.add(toolbarView);

    var searchBar = toolbarView.addTextField('', hintText, true);
	var searchBarFont = searchBar.font;
    var searchBarBoldFont = {
        fontSize : searchBar.font.fontSize,
        fontWeight : 'bold'
    };

    var newButton = toolbarView.addButton('/images/new.png');
	    
    newButton.addEventListener('click', function() {
        new DataWin('cases', -1, 
                    {name : searchBar.value}, dialogView).open();    
	});
    
    var borderView = Ti.UI.createView({
        width : Titanium.UI.FILL,
        height : 1,
        backgroundColor : theme.borderColor
    });
    dialogView.add(borderView);
    
    var casesTable = new DynamicTableView({
        left : '10dp',
        right : '10dp',
        height : Ti.Platform.displayCaps.platformHeight * 0.5
    });
    dialogView.add(casesTable);

    var suggestedSection = casesTable.addDynamicSection(L('suggested'));
    var recentSection = casesTable.addDynamicSection(L('recent'));
    var allSection = casesTable.addDynamicSection(L('all'));
    
    dialogView.addEventListener('open', function(e) {
        validCaseId = typeof(value) == 'number' && value > 0;
        searchBar.value = db.selectRow('cases', value).name;
        searchBar.font = (validCaseId) ? searchBarBoldFont : searchBarFont;
        var recentValues = Ti.App.Properties.getList(recentPropName, []);
        recentValues.reverse();
        if (recentValues.length > 0) {
            recentSection.rows = [];
            recentValues.forEach(function(value){
                var caseName = db.selectRow('cases', value).name;
                var row = recentSection.addRow(caseName, {caseId: value});
            });
            recentSection.visible = true;
        }
        var casesData = db.selectRows('cases', 
            {orderBy: 'id', ascending: false});
        casesData.forEach(function(caseData){
            var row = allSection.addRow(caseData.name, caseData.id);
        });
        allSection.visible = true;
        casesTable.update();
    });

    dialogView.addEventListener('update', function(e) {
        searchBar.value = e.value.name;
    });
    
    var autocompleteTimer = 0;
    searchBar.addEventListener('change', function(e) {
        var autocompleteUpdateTable = function() {
            suggestedSection.rows = [];
            if (e.value.length > 1) {
                var searchCriteria = {
                    orderBy: 'id',
                    ascending: false,
                    name: e.value
                };
                var casesData = db.selectRows('cases', searchCriteria);
                if (casesData.length == 0) {
                    suggestedSection.visible = false;
                    casesTable.update();
                    return;
                }
                casesData.forEach(function(caseData) {
                    var row = suggestedSection.addRow(caseData.name,
                                                      {caseId: caseData.id});
                    if (searchBar.value == caseData.name){
                        validCaseId = true;
                        dialogView.value = caseData.id;
                        searchBar.font = searchBarBoldFont;
                    }
                });
                suggestedSection.visible = true;
                allSection.visible = false;
            } else {
                suggestedSection.visible = false;
                allSection.visible = true;
            }
            casesTable.update();
        };
        if (validCaseId) {
            searchBar.font = searchBarFont;
            validCaseId = false;
        }
        clearTimeout(autocompleteTimer);
        autocompleteTimer = setTimeout(autocompleteUpdateTable,
                                       util.searchTimeout);
    });
    
    casesTable.addEventListener('click', function(e) {
        if (e.rowData.selectable == true) {
            validCaseId = true;
            dialogView.value = e.rowData.caseId;
            searchBar.value = e.rowData.title;
            searchBar.font = searchBarBoldFont;          
        }
    });

    return dialogView;
};

module.exports = CasesDialogView;