define(['marionette','modules/dc/views/dccomments',  'modules/dc/views/autoindexing', 'modules/types/saxs/dc/autointegrationSAXS', 'modules/dc/views/downstream',
    'modules/projects/views/addto',
    'utils/editable',
    'backbone',
    'modules/dc/views/imagestatusitem',
    'modules/dc/views/apstatusitem',
    'modules/dc/views/apmessagestatusitem',
    'modules/dc/views/reprocess2',
    'modules/dc/views/attachments',
    'modules/dc/views/apmessages',
    'modules/dc/views/dc',
    'modules/types/saxs/dc/datplot',
    'modules/types/saxs/dc/datplotlarge',
    'utils',
    'tpl!templates/types/saxs/dc/dc.html'], function(Marionette,
                                                     DCCommentsView,
                                                     DCAutoIndexingView, DCAutoIntegrationView, DCDownstreamView,
                                                     AddToProjectView, Editable, Backbone, DCImageStatusItem, APStatusItem, APMessageStatusItem,
                                                     ReprocessView,
                                                     AttachmentsView, APMessagesView, DCItemView, DatPlot, DatPlotLarge, utils, template) {

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
        imageStatusItem: DCImageStatusItem,
        apStatusItem: APStatusItem,
        apMessageStatusItem: APMessageStatusItem,

        events: {
            'click .holder h1.strat': 'loadStrategies',
            'click .distl': 'showPlot',
            'click .holder h1.ap': 'loadAP',
            'click .diffraction': 'showDiff',
            'click .atp': 'addToProject',
            'click .flag': 'flag',
            'click .comments': 'showComments',
            'click a.dl': 'showPlot',
            'click a.sn': 'showSnapshots',
            'click li.sample a': 'setProposal',
            'click @ui.exp': 'expandPath',
            'click @ui.rp': 'reprocess',
            'click a.attach': 'attachments',
            'click a.messages': 'showMessages',
        },

        ui: {
            temp: 'span.temp',
            exp: 'i.expand',
            cc: '.dcc',
            rp: 'a.reprocess',
        },

        initialize: function(options) {
            this.strat = null
            this.ap = null
            this.dp = null

            this.fullPath = false
        },

        onShow: function() {
            // element not always available at this point?
            var w = 0.175*$(window).width()*0.95
            var h = $(window).width() > 1280 ? w : ($(window).width() > 800 ? w*1.3 : (w*1.65))
            $('.distl,.diffraction,.snapshots', this.$el).height(h*0.8)

            if (this.getOption('plotView')) this.plotview = new (this.getOption('plotView'))({ parent: this.model, el: this.$el.find('.distl') })

            Backbone.Validation.unbind(this)
            Backbone.Validation.bind(this)
            // var edit = new Editable({ model: this.model, el: this.$el })
            // edit.create('COMMENTS', 'text')

            this.imagestatus = new (this.getOption('imageStatusItem'))({ ID: this.model.get('ID'), TYPE: this.model.get('DCT'), statuses: this.getOption('imagestatuses'), el: this.$el })
            this.apstatus = new (this.getOption('apStatusItem'))({ ID: this.model.get('ID'), SCREEN: (this.model.get('OVERLAP') != 0 && this.model.get('AXISRANGE')), statuses: this.getOption('apstatuses'), el: this.$el })
            this.listenTo(this.apstatus, 'status', this.updateAP, this)
            this.apmessagestatus = new (this.getOption('apMessageStatusItem'))({ ID: this.model.get('ID'), statuses: this.getOption('apmessagestatuses'), el: this.$el })
        },

        updateAP: function(e) {
            setTimeout(this.doUpdateAP.bind(this), 1000)
        },

        loadStrategies: function(e) {
            if (!this.strat) {
                this.strat = new DCAutoIndexingView({ id: this.model.get('ID') , el: $('div.strategies', this.$el) })
                this.strat.render()
            } else this.strat.$el.slideToggle()
        },

        showSnapshots: function(e) {
            e.preventDefault()
            this.$el.find('.snapshots a').eq(0).trigger('click')
        },

        showDiff: function(e) {
            e.preventDefault()
            this.$el.find('.diffraction a').eq(0).trigger('click')
        },

        showMessages: function(e) {
            e.preventDefault()

            var d = []
            if (this.model.get('DCC') > 1) d.dcg = this.model.get('DCG')
            else d.id = this.model.get('ID')

            app.dialog.show(new DialogView({
                title: 'Processing Messages',
                view: new APMessagesView(d)
            }))
        },

        setProposal: function(e) {
            console.log('setting proposal', this.model.get('PROP'))
            if (this.model.get('PROP')) app.cookie(this.model.get('PROP'))
        },

        expandPath: function(e) {
            e.preventDefault()

            this.ui.temp.text(this.fullPath ? (this.model.get('DIR')+this.model.get('FILETEMPLATE')) : (this.model.get('DIRFULL')+this.model.get('FILETEMPLATE')))
            this.ui.exp.toggleClass('fa-caret-right')
            this.ui.exp.toggleClass('fa-caret-left')

            this.fullPath = !this.fullPath
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

        reprocess: function(e) {
            e.preventDefault()

            if (app.dialog.currentView instanceof ReprocessView) app.dialog.currentView.collection.add(this.model)
            else app.dialog.show(new ReprocessView({ model: this.model, visit: this.getOption('visit') }))
        },

        doUpdateAP: function() {
            if (this.ap) this.ap.fetch()
            if (this.strat) this.strat.fetch()
            if (this.dp) this.dp.fetch()
        },


        showPlot: function(e) {
            e.preventDefault()
            app.dialog.show(new PlotDialog({ title: '1D Plot', view: new DatPlotLarge({ parent: this.model }), autoSize: true }))
        },

        addToProject: function(e) {
            e.preventDefault()
            app.dialog.show(new AddToProjectView({ name: this.model.get('DIR')+this.model.get('FILETEMPLATE'), type: 'dc', iid: this.model.get('DCG') }))
        },

        flag: function(e) {
            e.preventDefault()
            this.model.flag()
        },

        loadAP: function(e) {
            if (!this.ap) {
                this.ap = new DCAutoIntegrationView({ id: this.model.get('ID'), el: this.$el.find('div.autoproc') })
            } else this.ap.$el.slideToggle()
        },

        showComments: function(e) {
            e.preventDefault()
            app.dialog.show(new DialogView({ title: 'Data Collection Comments', view: new DCCommentsView({ model: this.model }), autoSize: true }))
        },




    })

})