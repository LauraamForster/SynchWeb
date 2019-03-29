define([
        'modules/dc/datacollections',
        'modules/dc/dclist',
        'modules/types/saxs/dc/dc',
        'tpl!templates/types/gen/dc/dclist.html',
        ],
function(DataCollections, DCList, DCItemView, template) {

    var SaxsDCList = DCList.extend({
        dcViews: {
            data: DCItemView,
        }
    })
    
    return DataCollections.extend({
        dcListView: SaxsDCList,
        template: template,
        filters: false,
        sampleChanger: false,
    })
})
