define([
    'modules/types/gen/dc/dc',
    'modules/projects/views/addto',
    'modules/dc/views/dccomments',
    'modules/types/saxs/dc/autointegrationSAXS',
    'modules/types/saxs/dc/datplot',
    'modules/types/saxs/dc/datplotlarge',
    'modules/dc/views/attachments',
    'utils',
    'backbone',
    'tpl!templates/types/saxs/dc/dc.html'], function(DCItemView, AddToProjectView, DCCommentsView, DCAutoIntegrationView, DatPlot, DatPlotLarge, AttachmentsView, utils, Backbone, template) {

    var PlotDialog = DialogView.extend({
        title: 'Add Phase',
        className: 'content',
        autoSize: true,

        buttons: {
            'Log x': 'LogX',
            'Log y': 'LogY',
            'Log X Y': 'LogXY',
            'revertLog': 'revert',
            'Cancel': 'closeDialog',
        },

        LogX: function (e) {
            Backbone.trigger("LogXax");
        },
        LogY: function (e) {
            Backbone.trigger("LogYax");
        },
        LogXY: function (e) {
            Backbone.trigger("LogXYax");
        },
        revert: function (e) {
            Backbone.trigger("revert");
        }

    });

    return DCItemView.extend({
        template: template,
        plotView: DatPlot,
        // imageStatusItem: DCImageStatusItem,

        events: {
            'click .distl': 'showPlot',
            'click .diffraction': 'showDiff',
            'click .holder h1.ap': 'loadAP',
            'click .atp': 'addToProject',
            'click .flag': 'flag',
            'click .comments': 'showComments',
            'click a.dl': 'showPlot',
            'click a.sn': 'showSnapshots',
            'click a.attach': 'attachments',
            'click a.dd': utils.signHandler,
        },

        showDiff: function(e) {
            e.preventDefault()
            this.$el.find('.diffraction a').eq(0).trigger('click')
        },

        
        loadAP: function(e) {
            if (!this.ap) {
                this.ap = new DCAutoIntegrationView({ id: this.model.get('ID'), el: this.$el.find('div.autoproc') })
            } else this.ap.$el.slideToggle()
        },

        showPlot: function(e) {
            e.preventDefault()
            app.dialog.show(new PlotDialog({ title: '1D Plot', view: new DatPlotLarge({ parent: this.model }), autoSize: true }))
        },

        attachments: function(e) {
            e.preventDefault()

            var d = []
            if (this.model.get('DCC') > 1) d.dcg = this.model.get('DCG')
            else d.id = this.model.get('ID')

            app.dialog.show(new DialogView({
                title: 'Attachments',
                view: new AttachmentsView(d)
            }))
        },

        showComments: function(e) {
            e.preventDefault()
            app.dialog.show(new DialogView({ title: 'Data Collection Comments', view: new DCCommentsView({ model: this.model }), autoSize: true }))
        },

        addToProject: function(e) {
            e.preventDefault()
            app.dialog.show(new AddToProjectView({ name: this.model.get('DIR')+this.model.get('FILETEMPLATE'), type: 'dc', iid: this.model.get('DCG') }))
        },

    })

})