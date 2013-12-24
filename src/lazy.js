(function() {
    /**
     * Создает функцию, которая выполняется с отсрочкой timeout ms в "Ленивом" режиме.
     * @param {number} timeout отсрочки
     * @param {Object} [context] контекст для функции (по аналогии с bind)
     * @param {Object} [params] параметры
     *      @param {boolean} [params.first] говорит о том, что нужно выполнять функцию с первыми аргументами,
     *          в том случае, если было несколько вызовов в течении интервала (в противном случае с последними).
     * @return {Function} ленивый аналог функции
     */
    var lazyFunc = function(timeout, context, params) {
        var firstArgs = !!(params && params.first);
        var wait = false;
        var isStopped = false;
        var timeoutId;
        var args;
        var runContext = context;
        var lazy = function() {
            if (!firstArgs || !wait) {
                runContext = context || this;
                args = arguments;
            }
            if (!wait) {
                if (isStopped) {
                    lazy.originalFunc.apply(context || this, arguments);
                } else {
                    wait = true;
                    timeoutId = setTimeout(function() {
                        wait = false;
                        lazy.originalFunc.apply(runContext, args);
                    }, timeout);
                }
            }
        };
        lazy.originalFunc = this;
        lazy.bindContext = context;
        lazy.toggle = function(enable, wakeup) {
            if (arguments.length && enable || isStopped) {
                wait = false;
                isStopped = false;
            } else {
                clearTimeout(timeoutId);
                if (wakeup && wait) {
                    wait = false;
                    lazy.originalFunc.apply(runContext, args);
                }
                isStopped = true;
            }
        };
        lazy.immediate = immediate;
        lazy.resume = resume;
        lazy.stop = stop;
        return lazy;
    };

    /**
     * Моментальное выполнение
     * @param context
     */
    function immediate(context) {
        this.originalFunc.apply(this.originalFunc.bindContext || context, arguments);
    }

    /**
     * Возобновить отложенное выполнение
     */
    function resume() {
        this.toggle(true);
    }

    /**
     * Остановить отложенные выполнения
     * @param {boolean|string} [wakeup] если true, то выполнить последний вызов в очереди
     *                                  если 'all', то выполнить все отложенные вызовы перед остановкой
     */
    function stop(wakeup) {
        this.toggle(false, wakeup);
    }

    /**
     * Расширение прототипа
     */
    Function.prototype.lazy = lazyFunc;

})();
