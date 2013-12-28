
describe('Функция "lazy":', function() {

    beforeEach(function() {
        jasmine.Clock.useMock();

        this.original = jasmine.createSpy();

        this.lazyFunc = this.original.lazy(100);
    });

    it('есть в прототипе Function', function() {
        expect(Function.prototype.lazy).toBeDefined();
        expect(typeof Function.prototype.lazy).toBe('function');
    });

    it('выполняется с отсрочкой', function() {
        this.lazyFunc();

        jasmine.Clock.tick(99);

        expect(this.original).not.toHaveBeenCalled();

        jasmine.Clock.tick(2);

        expect(this.original).toHaveBeenCalled();
    });

    it('отсрочка выполняется один раз', function() {
        this.lazyFunc();

        jasmine.Clock.tick(1000);

        expect(this.original.callCount).toEqual(1);
    });

    it('правильно передаются аргументы', function() {
        this.lazyFunc('TEST ARG');

        jasmine.Clock.tick(101);

        expect(this.original).toHaveBeenCalled();
        expect(this.original).toHaveBeenCalledWith('TEST ARG');
    });

    it('отсроченая функция срабатывает только один раз во время интервала отсрочки', function() {
        this.lazyFunc();
        this.lazyFunc();
        this.lazyFunc();

        jasmine.Clock.tick(1000);

        expect(this.original.callCount).toEqual(1);
    });

    it('отсроченая функция выполняется с последними вызванными аргументами', function() {
        this.lazyFunc(1);
        this.lazyFunc(2);
        this.lazyFunc(3);

        jasmine.Clock.tick(1000);

        expect(this.original).toHaveBeenCalledWith(3);
    });

    it('отсроченая функция выполняется с первыми вызванными аргументами c параметром "first"', function() {
        this.lazyFunc = this.original.lazy(100, this, { first: true });

        this.lazyFunc(1);
        this.lazyFunc(2);
        this.lazyFunc(3);

        jasmine.Clock.tick(1000);

        expect(this.original).toHaveBeenCalledWith(1);
    });

    it('функция вызывается с правильным контекстом', function() {
        var obj = {
            original: jasmine.createSpy(),
            prop: 31
        };

        obj.lazy = obj.original.lazy(100);
        obj.lazy();

        jasmine.Clock.tick(200);

        expect(obj.original.mostRecentCall.object).toBe(obj);
    });

    it('функция вызывается с правильным контекстом при биндинге', function() {
        var obj = {
            original: jasmine.createSpy(),
            prop: 31
        };

        var bindObj = {
            prop: 41
        };

        obj.lazy = obj.original.lazy(100, bindObj);
        obj.lazy();

        jasmine.Clock.tick(200);

        expect(obj.original.mostRecentCall.object).toBe(bindObj);
    });

    it('контекст функции форсируется параметром', function() {
        var original = jasmine.createSpy();

        var bindObj = {
            prop: 31
        };

        var lazy = original.lazy(100, bindObj);
        lazy();

        jasmine.Clock.tick(200);

        expect(original.mostRecentCall.object).toBe(bindObj);
    });

    it('правильно срабатывает в случае с таймаутом 0', function() {
        this.lazyFunc = this.original.lazy(0);

        this.lazyFunc();
        this.lazyFunc();
        this.lazyFunc();

        expect(this.original).not.toHaveBeenCalled();

        // Jump to next tick
        jasmine.Clock.tick(0);

        expect(this.original.callCount).toBe(1);
    });

    describe('функция "stop"', function() {

        it('предотвращает вызов', function() {
            this.lazyFunc();
            this.lazyFunc.stop();

            jasmine.Clock.tick(1000);

            expect(this.original).not.toHaveBeenCalled();
        });

        it('предотвращает вызов (асинхронный вариант)', function() {
            this.lazyFunc();

            jasmine.Clock.tick(50);
            this.lazyFunc.stop();

            jasmine.Clock.tick(1000);

            expect(this.original).not.toHaveBeenCalled();
        });

        it('вызывает оригинальную функцию при параметре "wakeup"', function() {
            this.lazyFunc();
            this.lazyFunc.stop(true);

            expect(this.original).toHaveBeenCalled();
        });

        it('вызывает оригинальную функцию при параметре "wakeup" (асинхронный вариант)', function() {
            this.lazyFunc();

            jasmine.Clock.tick(50);
            this.lazyFunc.stop(true);

            expect(this.original).toHaveBeenCalled();
        });

        it('не вызывает оригинальную функцию при параметре "wakeup" если нету очереди', function() {
            this.lazyFunc();

            jasmine.Clock.tick(200);
            this.original.reset();

            this.lazyFunc.stop(true);

            expect(this.original).not.toHaveBeenCalled();
        });

        it('вызывается с правильным контекстом при биндинге', function() {
            var obj = {
                original: jasmine.createSpy(),
                prop: 31
            };

            var bindObj = {
                prop: 41
            };

            obj.lazy = obj.original.lazy(100, bindObj);
            obj.lazy();

            obj.lazy.stop(true);

            expect(obj.original.mostRecentCall.object).toBe(bindObj);
        });
    });

    describe('функция "resume"', function() {

        it('возобновляет отложенные вызовы', function() {
            this.lazyFunc();
            this.lazyFunc();

            jasmine.Clock.tick(10);
            this.lazyFunc.stop();

            jasmine.Clock.tick(1000);
            expect(this.original).not.toHaveBeenCalled();

            this.lazyFunc.resume();

            this.lazyFunc();
            this.lazyFunc();

            expect(this.original).not.toHaveBeenCalled();

            jasmine.Clock.tick(200);
            expect(this.original).toHaveBeenCalled();
        });
    });
});
