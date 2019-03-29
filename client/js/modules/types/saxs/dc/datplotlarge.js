define(['marionette', 
        'modules/types/gen/dc/models/dat',
        'collections/datacollections',
        'backbone',
        'utils',
        'jquery',
        'jquery.flot',
        'jquery.flot.resize',
        'jquery.flot.axislabels'
], function(Marionette, Dat, DataCollections, Backbone, utils, $) {

    var DatCollection = Backbone.Collection.extend({

    })


    // DAT Plot
    return Marionette.ItemView.extend({
        template: false,
        model: Dat,
        modelEvents: { 'change': 'render' },

        events: {
            // 'plothover': 'cursor',
            plotselected: 'zoom',
            'dblclick canvas': 'reset',
            touchstart: 'touchStart',
        },




        touchStart: function(e) {
            if (e.originalEvent.touches && e.originalEvent.touches.length >  1) return
            e.preventDefault()
            if (e.originalEvent.touches && e.originalEvent.touches.length) {
                if (this.lastClick && (new Date() - this.lastClick < 1000)) {
                    this.reset(e)
                    return
                }
                this.lastClick = new Date()
            }
        },


        reset: function(e) {
            this.zoom(e, {
                xaxis: {
                    from: null, to: null
                },
                yaxis: {
                    from: null, to: null
                },
            })
        },

        LogX: function() {
            var options = $.extend({}, utils.default_plot, {
                series: {
                    lines: {
                        show: true,
                    },
                    points: {
                        show: false,
                    }
                },
                selection: {
                    mode: 'xy',
                },
                xaxes: [{
                    transform: function (v) {
                        return v === 0 ? 0 : Math.log(v);
                    },
                    inverseTransform: function (v) {
                        return Math.exp(v);
                    },
                }],
            })
                var d = []
                this.models.each(function(m) {
                    var series = { data: m.get('data')[0], label: m.get('start') }
                    d.push(series)
                })
                this.plot = $.plot(this.$el, d, options)
                this.$el.css('opacity', 1)
        },

        LogY: function() {
            var options = $.extend({}, utils.default_plot, {
                series: {
                    lines: {
                        show: true,
                    },
                    points: {
                        show: false,
                    }
                },
                selection: {
                    mode: 'xy',
                },
                yaxes: [{
                    transform: function (v) {
                        return v === 0 ? 0 : Math.log(v);
                    },
                    inverseTransform: function (v) {
                        return Math.exp(v);
                    },
                }],
            })

            var d = []
            this.models.each(function(m) {
                var series = { data: m.get('data')[0], label: m.get('start') }
                d.push(series)
            })

            this.plot = $.plot(this.$el, d, options)
            this.$el.css('opacity', 1)
        },

        LogXY: function() {
            var options = $.extend({}, utils.default_plot, {
                series: {
                    lines: {
                        show: true,
                    },
                    points: {
                        show: false,
                    }
                },
                selection: {
                    mode: 'xy',
                },
                xaxes: [{
                    transform: function (v) {
                        return v === 0 ? 0 : Math.log(v);
                    },
                    inverseTransform: function (v) {
                        return Math.exp(v);
                    },
                }],
                yaxes: [{
                    transform: function (v) {
                        return v === 0 ? 0 : Math.log(v);
                    },
                    inverseTransform: function (v) {
                        return Math.exp(v);
                    },
                }],
            })

            var d = []
            this.models.each(function(m) {
                var series = { data: m.get('data')[0], label: m.get('start') }
                d.push(series)
            })

            this.plot = $.plot(this.$el, d, options)
            this.$el.css('opacity', 1)
        },

        zoom: function(e, ranges) {
            if (!ranges.xaxis) return

            var opts = this.plot.getOptions()
            _.each(opts.xaxes, function(axis) {
                axis.min = ranges.xaxis.from
                axis.max = ranges.xaxis.to
            })
            _.each(opts.yaxes, function(axis) {
                axis.min = ranges.yaxis.from
                axis.max = ranges.yaxis.to
            })

            this.plot.setupGrid()
            this.plot.draw()
            this.plot.clearSelection()
        },

        initialize: function(options) {
            this.lastClick = null
            var pm = options.parent

            this.models = new DatCollection()
            this.listenTo(this.models, 'add', this.render)

                           
            if (pm.get('BLSAMPLEID')) {
                this.dcs = new DataCollections(null, { running: false })
                this.dcs.queryParams.sid = pm.get('BLSAMPLEID')
                this.listenTo(this.dcs, 'sync', this.updatePrevious, this)
                this.dcs.fetch()
                this.$el.addClass('loading')
            }

            this.model = new Dat({ id: pm.get('ID'), pm: pm })
            this.model.fetch().done(this.addRoot.bind(this))

            this.$el.css('opacity', 0)

            this.listenTo(Backbone, 'LogXax', this.LogX);
            this.listenTo(Backbone, 'LogYax', this.LogY);
            this.listenTo(Backbone, 'LogXYax', this.LogXY);
            this.listenTo(Backbone, 'revert', this.onRender);
        },

        addRoot: function() {
            this.models.add(this.model)
        },

        updatePrevious: function() {
            console.log('dcs', this.dcs)
            var ready = []
            this.dcs.each(function(dc) {
                var self = this
                var m = new Dat({ id: dc.get('ID'), pm: dc })
                m.stop()
                ready.push(m.fetch().done(function() {
                    self.models.add(m)
                }))
            }, this)

            var self = this
            $.when.apply($, ready).done(function() {
                self.$el.removeClass('loading')
            })
        },

        onRender: function() {
            if (this.model.get('data')) {
                var options = $.extend({}, utils.default_plot, {
                    series: {
                        lines: {
                            show: true,
                        },
                        points: {
                            show: false,
                        }
                    },
                    selection: {
                        mode: 'xy',
                    },

                    xaxes: [{
                        axisLabel: 'Q',
                    }],

                    yaxes: [{
                        axisLabel: 'I',
                    }],

                })

                var d = []
                this.models.each(function(m) {
                    var series = { data: m.get('data')[0], label: m.get('start') }
                    d.push(series)
                })

                this.plot = $.plot(this.$el, d, options)
                this.$el.css('opacity', 1)
            }
        },

        onDestroy: function() {
            this.model.stop()
            if (this.plot) this.plot.shutdown()
        }
    })



})
