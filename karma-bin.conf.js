// Karma product configuration for test compressed file

module.exports = function(config) {
    require('./karma.conf.js')(config);

    config.files[0] = 'bin/lazyproc.min.js'
};
