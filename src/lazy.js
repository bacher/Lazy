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
            // TODO: подумать о wait
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
     * Создает функцию, которая выполняется с отсрочкой timeout ms.
     * @param {number} timeout отсрочки
     * @param {Object} [context] контекст для функции (по аналогии с bind)
     * @return {Function} отсроченный аналог функции
     */
    var delayedFunc = function(timeout, context) {
        var isStopped = false;
        var queue = [];

        var delay = function() {
            if (isStopped) {
                delay.originalFunc.apply(context || this, arguments);
            } else {
                queue.push({
                    timeoutId: setTimeout(handle, timeout),
                    context: context || this,
                    args: arguments
                });
                delay.queueLength = queue.length;
            }
        };
        delay.originalFunc = this;
        delay.bindContext = context;

        function handle() {
            var task = queue.shift();
            delay.queueLength = queue.length;
            delay.originalFunc.apply(task.context, task.args);
        }

        delay.toggle = function(enable, wakeup) {
            if (arguments.length && enable || isStopped) {
                isStopped = false;
            } else {
                for (var i = 0, len = queue.length; i < len; ++i) {
                    var task = queue[i];
                    clearTimeout(task.timeoutId);
                    if (wakeup && (wakeup === 'all' || i === len - 1 )) {
                        delay.originalFunc.apply(task.context, task.args);
                    }
                }
                queue = [];
                isStopped = true;
            }
        };
        delay.immediate = immediate;
        delay.resume = resume;
        delay.stop = stop;
        delay.queueLength = 0;
        return delay;
    };

    /**
     * Создает функцию, которая выполняется с отсрочкой timeout ms после последнего вызова.
     * @param {number} timeout отсрочки
     * @param {Object} [context] контекст для функции (по аналогии с bind)
     * @return {Function} функция с отскоком
     */
    var bouncedFunc = function(timeout, context) {
        var wait = false;
        var isStopped = false;
        var timeoutId;
        var args;
        var runContext = context;
        var runId = 0;
        var bounce = function() {
            runContext = context || this;
            args = arguments;

            if (isStopped) {
                bounce.originalFunc.apply(context || this, arguments);
            } else {
                wait = true;
                var currentId = ++runId;
                clearTimeout(timeoutId);
                timeoutId = setTimeout(function() {
                    if (runId === currentId) {
                        wait = false;
                        bounce.originalFunc.apply(runContext, args);
                    }
                }, timeout);
            }
        };
        bounce.originalFunc = this;
        bounce.bindContext = context;
        bounce.toggle = function(enable, wakeup) {
            if (arguments.length && enable || isStopped) {
                wait = false;
                isStopped = false;
            } else {
                clearTimeout(timeoutId);
                if (wakeup && wait) {
                    wait = false;
                    bounce.originalFunc.apply(runContext, args);
                }
                isStopped = true;
            }
        };
        bounce.immediate = immediate;
        bounce.resume = resume;
        bounce.stop = stop;
        return bounce;
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
    var fn = Function.prototype;
    if (typeof Object.defineProperties === 'function') {
        Object.defineProperties(fn, {
            lazy: {
                value: lazyFunc,
                configurable: true,
                writable: true
            },
            delayed: {
                value: delayedFunc,
                configurable: true,
                writable: true
            },
            bounced: {
                value: bouncedFunc,
                configurable: true,
                writable: true
            }
        });
    } else {
        fn.lazy = lazyFunc;
        fn.delayed = delayedFunc;
        fn.bounced = bouncedFunc;
    }

})();
