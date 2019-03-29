define(['marionette',
    'views/tabs',
    'collections/autoprocattachments',
    'modules/dc/collections/autointegrations',
    'modules/dc/views/rdplot',
    'modules/dc/views/aiplots',
    'modules/dc/views/autoprocattachments',
    'modules/dc/views/apmessages',

    'backbone',
    'modules/dc/views/dc',
    'modules/dc/views/imagestatusitem',

    'views/log',
    'views/table',
    'utils/table',
    'utils',
    'tpl!templates/types/saxs/dc/dc_autoprocSAXS.html'], function(Marionette, TabView,
        AutoProcAttachments, AutoIntegrations,
        RDPlotView, AIPlotsView, AutoProcAttachmentsView, APMessagesView,
        Backbone, DCItemView, DCImageStatusItem,
        LogView, TableView, table,
        utils, template) {


    var AutoIntegrationItem = Marionette.LayoutView.extend({
        template: template,
        modelEvents: { 'change': 'render' },

        events: {
            'click .logf': 'showLog',
            'click .rd': 'showRD',
            'click .plot': 'showPlots',
            'click a.apattach': 'showAttachments',
            'click .dll': utils.signHandler,
        },

        regions: {
            messages: '.messages'
        },

        onRender: function() {
            this.messages.show(new APMessagesView({ messages: new Backbone.Collection(this.model.get('MESSAGES')), embed: true }))
        },

        showAttachments: function(e) {
            e.preventDefault()

            this.attachments = new AutoProcAttachments()
            this.attachments.queryParams.AUTOPROCPROGRAMID = this.model.get('AID')
            this.attachments.fetch()

            app.dialog.show(new DialogView({
                title: 'Auto Processing Attachments: '+this.model.escape('TYPE'),
                view: new AutoProcAttachmentsView({ collection: this.attachments }),
                autosize: true
            }))
        },

        showLog: function(e) {
            e.preventDefault()
            var url = $(e.target).attr('href')
            var self = this
            utils.sign({
                url: url,
                callback: function(resp) {
                    app.dialog.show(new LogView({ title: self.model.get('TYPE') + ' Log File', url: url+'?token='+resp.token }))
                }
            })
            // app.dialog.show(new LogView({ title: this.model.get('TYPE') + ' Log File', url: $(e.target).attr('href') }))
            return false
        },

        showRD: function(e) {
            e.preventDefault()
            app.dialog.show(new DialogView({ title: 'RD Plot', view: new RDPlotView({ aid: this.model.get('AID'), id: this.getOption('templateHelpers').DCID }), autoSize: true }))
        },

        showPlots: function(e) {
            e.preventDefault()
            app.dialog.show(new DialogView({ title: 'Integration Statistic Plots', view: new AIPlotsView({ aid: this.model.get('AID'), id: this.getOption('templateHelpers').DCID }), autoSize: true }))
        },

    })


    var DCAPTabView = TabView.extend({
        tabContentItem: function() { return AutoIntegrationItem },
        tabTitle: 'TYPEICON',
        tabID: 'AID',

        childViewOptions: function() {
            return {
                templateHelpers: { DCID: this.getOption('id'), APIURL: app.apiurl }
            }
        },
    })

    var SelectTabRow = Backgrid.Row.extend({
        events: {
            'click': 'selectTab',
        },

        selectTab: function(e) {
            e.preventDefault()

            console.log('click row' ,this.model.get('AID'), this.$el.closest('.sw'))
            this.$el.closest('.summary').siblings('.sw').find('a[href="#tabs-'+this.model.get('AID')+'"]').trigger('click');
        }
    })


    return Marionette.LayoutView.extend({
        template: _.template('<div class="ui-tabs summary"></div><div class="sw"></div><div class="res"></div>'),
        regions: {
            wrap: '.sw',
            summary: '.summary',
        },

        initialize: function(options) {
            this.collection = new AutoIntegrations(null, { id: options.id })
            this.collection.fetch().done(this.render.bind(this))
        },

        fetch: function() {
            this.collection.fetch()
        },

        onRender: function() {
            this.update()
            this.listenTo(this.collection, 'sync', this.update, this)
        },

        update: function() {
            if (this.collection.length) {
                this.$el.removeClass('ui-tabs')
                this.wrap.show(new DCAPTabView({
                    collection: this.collection,
                    id: this.getOption('id'),
                    el: this.$el.find('.res'),
                }))
            }

            this.$el.slideDown()
        }

    })





    return DCItemView.extend({
        template: template,
        imageStatusItem: DCImageStatusItem,
        //
        events: {

            'click a.sn': 'showSnapshots',
        },
        //
        ui: {
            temp: 'span.temp',
            exp: 'i.expand',
            cc: '.dcc',
            rp: 'a.reprocess',
        },
        //
        initialize: function(options) {
            this.fullPath = false
        },
        //
        onShow: function() {
        //     // element not always available at this point?
            var w = 0.175*$(window).width()*0.95
        //     var h = $(window).width() > 1280 ? w : ($(window).width() > 800 ? w*1.3 : (w*1.65))
            $('.snapshots', this.$el).height(h*0.8)
        //
            if (this.getOption('plotView')) this.plotview = new (this.getOption('plotView'))({ parent: this.model, el: this.$el.find('.distl') })
        //
            Backbone.Validation.unbind(this)
            Backbone.Validation.bind(this)
        //
            this.imagestatus = new (this.getOption('imageStatusItem'))({ DCID: this.model.get('ID'), TYPE: this.model.get('DCT'), statuses: this.getOption('imagestatuses'), el: this.$el })
        },

        showSnapshots: function(e) {
            e.preventDefault()
            this.$el.find('.snapshots a').eq(0).trigger('click')
        },
    })
})
