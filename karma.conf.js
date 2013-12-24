// Karma development configuration

module.exports = function(config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine'],
        files: [
            'src/lazy.js',
            'tests/unit/*.spec.js'
        ],
        exclude: [],
        reporters: ['dots'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ['PhantomJS'],
        captureTimeout: 10000,
        autoWatch: true,
        singleRun: false
    });
};
