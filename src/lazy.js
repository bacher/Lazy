(function() {
    /**
     * Создает функцию, которая выполняется с отсрочкой timeout ms в "Ленивом" режиме.
     * @param {number} timeout отсрочки
     * @param {Object} [context] контекст для функции (по аналогии с bind)
     * @param {Object} [params] параметры
     *      @param {boolean} [params.first] говорит о том, что нужно выполнять функцию с первыми аргументами,
     *          в том случае, если было несколько вызовов в течении интервала (в противном случае с последними).
     * @return {Function} ленивый аналог функции с дополнительными методами
     *      func.reset({boolean|string}, [wakeup]) Сбросить отложенные выполнения
     *                                    wakeup если true, то выполнить отложенный вызов в очереди моментально
     *      func.exec([args...]) Выполнить оригинальную функцию синхронно
     *      func.execWith(context, [args...]) Выполнить оригинальную функцию синхронно в контексте
     */
    var lazyFunc = function(timeout, context, params) {
        var firstArgs = !!(params && params.first);
        var wait = false;
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
                wait = true;
                timeoutId = setTimeout(function() {
                    wait = false;
                    lazy.originalFunc.apply(runContext, args);
                }, timeout);
            }
        };
        lazy.originalFunc = this;
        lazy.bindContext = context;
        lazy.reset = function(wakeup) {
            clearTimeout(timeoutId);
            if (wakeup && wait) {
                wait = false;
                lazy.originalFunc.apply(runContext, args);
            }
        };
        lazy.exec = exec;
        lazy.execWith = execWith;
        return lazy;
    };

    /**
     * Создает функцию, которая выполняется с отсрочкой timeout ms.
     * @param {number} timeout отсрочки
     * @param {Object} [context] контекст для функции (по аналогии с bind)
     * @return {Function} отсроченный аналог функции
     *      func.reset({boolean|string}, [wakeup]) Сбросить отложенные выполнения
     *                                  если true, то выполнить отложенный вызов в очереди
     *                                  если 'all', то выполнить все отложенные вызовы перед остановкой
     *      func.exec([args...]) Выполнить оригинальную функцию синхронно
     *      func.execWith(context, [args...]) Выполнить оригинальную функцию синхронно в контексте
     */
    var delayedFunc = function(timeout, context) {
        var queue = [];

        var delay = function() {
            queue.push({
                timeoutId: setTimeout(handle, timeout),
                context: context || this,
                args: arguments
            });
            delay.queueLength = queue.length;
        };
        delay.originalFunc = this;
        delay.bindContext = context;

        function handle() {
            var task = queue.shift();
            delay.queueLength = queue.length;
            delay.originalFunc.apply(task.context, task.args);
        }

        delay.reset = function(wakeup) {
            for (var i = 0, len = queue.length; i < len; ++i) {
                var task = queue[i];
                clearTimeout(task.timeoutId);
                if (wakeup && (wakeup === 'all' || i === len - 1 )) {
                    delay.originalFunc.apply(task.context, task.args);
                }
            }
            queue = [];
        };
        delay.exec = exec;
        delay.execWith = execWith;
        delay.queueLength = 0;
        return delay;
    };

    /**
     * Создает функцию, которая выполняется с отсрочкой timeout ms после последнего вызова.
     * @param {number} timeout отсрочки
     * @param {Object} [context] контекст для функции (по аналогии с bind)
     * @return {Function} функция с отскоком
     *      func.reset({boolean|string}, [wakeup]) Сбросить отложенные выполнения
     *                                    wakeup если true, то выполнить отложенный вызов в очереди
     *      func.exec([args...]) Выполнить оригинальную функцию синхронно
     *      func.execWith(context, [args...]) Выполнить оригинальную функцию синхронно в контексте
     */
    var bouncedFunc = function(timeout, context) {
        var wait = false;
        var timeoutId = -1;
        var args;
        var runContext = context;

        var bounce = function() {
            runContext = context || this;
            args = arguments;

            wait = true;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(function() {
                wait = false;
                bounce.originalFunc.apply(runContext, args);
            }, timeout);
        };
        bounce.originalFunc = this;
        bounce.bindContext = context;
        bounce.reset = function(wakeup) {
            clearTimeout(timeoutId);
            if (wakeup && wait) {
                wait = false;
                bounce.originalFunc.apply(runContext, args);
            }
        };
        bounce.exec = exec;
        bounce.execWith = execWith;
        return bounce;
    };


    /**
     * Helpers
     */

    /**
     * Моментальное выполнение
     * @params {any} args...
     */
    function exec() {
        this.originalFunc.apply(this.originalFunc.bindContext, arguments);
    }

    /**
     * Моментальное выполнение с заданием контекста
     * @param context
     * @params {any} args...
     */
    function execWith(context) {
        this.originalFunc.apply(context || this.originalFunc.bindContext, [].slice.call(arguments, 1));
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
