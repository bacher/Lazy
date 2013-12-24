
describe('Функция "bounced":', function() {

    beforeEach(function() {
        jasmine.Clock.useMock();

        this.original = jasmine.createSpy();

        this.bouncedFunc = this.original.bounced(100);
    });

    it('есть в прототипе Function', function() {
        expect(Function.prototype.bounced).toBeDefined();
        expect(typeof Function.prototype.bounced).toBe('function');
    });

    it('выполняется с отсрочкой', function() {
        this.bouncedFunc();

        jasmine.Clock.tick(99);

        expect(this.original).not.toHaveBeenCalled();

        jasmine.Clock.tick(2);

        expect(this.original).toHaveBeenCalled();
    });

    it('отсрочка выполняется один раз', function() {
        this.bouncedFunc();

        jasmine.Clock.tick(1000);

        expect(this.original.callCount).toEqual(1);
    });

    it('правильно передаются аргументы', function() {
        this.bouncedFunc('TEST ARG');

        jasmine.Clock.tick(101);

        expect(this.original).toHaveBeenCalled();
        expect(this.original).toHaveBeenCalledWith('TEST ARG');
    });

    it('отсроченая функция срабатывает только один раз во время интервала отсрочки', function() {
        this.bouncedFunc();
        this.bouncedFunc();
        this.bouncedFunc();

        jasmine.Clock.tick(1000);

        expect(this.original.callCount).toEqual(1);
    });

    it('отсроченая функция выполняется с последними вызванными аргументами', function() {
        this.bouncedFunc(1);
        this.bouncedFunc(2);
        this.bouncedFunc('last call');

        jasmine.Clock.tick(1000);

        expect(this.original).toHaveBeenCalledWith('last call');
    });

    it('функция вызывается с правильным контекстом', function() {
        var obj = {
            prop: 31,
            original: this.original
        };

        obj.bouncedFunc = obj.original.bounced(100);
        obj.bouncedFunc();

        jasmine.Clock.tick(200);

        expect(obj.original.mostRecentCall.object).toBe(obj);
    });

    it('функция вызывается с правильным контекстом при биндинге', function() {
        var obj = {
            prop: 41
        };

        this.bouncedFunc = this.original.bounced(100, obj);
        this.bouncedFunc();

        jasmine.Clock.tick(200);

        expect(this.original.mostRecentCall.object).toBe(obj);
    });

    it('контекст функции форсируется параметром', function() {
        var obj = {
            original: this.original,
            prop: 31
        };

        var bindObj = {
            prop: 41
        };

        obj.bouncedFunc = obj.original.bounced(100, bindObj);
        obj.bouncedFunc();

        jasmine.Clock.tick(200);

        expect(obj.original.mostRecentCall.object).toBe(bindObj);
    });

    describe('функция "stop"', function() {

        it('предотвращает вызов', function() {
            this.bouncedFunc();
            this.bouncedFunc.stop();

            jasmine.Clock.tick(1000);

            expect(this.original).not.toHaveBeenCalled();
        });

        it('предотвращает вызов (асинхронный вариант)', function() {
            this.bouncedFunc();

            jasmine.Clock.tick(50);
            this.bouncedFunc.stop();

            jasmine.Clock.tick(1000);

            expect(this.original).not.toHaveBeenCalled();
        });

        it('вызывает оригинальную функцию при параметре "wakeup"', function() {
            this.bouncedFunc();
            this.bouncedFunc.stop(true);

            expect(this.original).toHaveBeenCalled();
        });

        it('вызывает оригинальную функцию при параметре "wakeup" (асинхронный вариант)', function() {
            this.bouncedFunc();

            jasmine.Clock.tick(50);
            this.bouncedFunc.stop(true);

            expect(this.original).toHaveBeenCalled();
        });

        it('не вызывает оригинальную функцию при параметре "wakeup" если нету очереди', function() {
            this.bouncedFunc();

            jasmine.Clock.tick(200);
            this.original.reset();

            this.bouncedFunc.stop(true);

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

            obj.bouncedFunc = obj.original.lazy(100, bindObj);
            obj.bouncedFunc();

            obj.bouncedFunc.stop(true);

            expect(obj.original.mostRecentCall.object).toBe(bindObj);
        });
    });

    describe('функция "resume"', function() {

        it('возобновляет отложенные вызовы', function() {
            this.bouncedFunc();
            this.bouncedFunc();

            jasmine.Clock.tick(10);
            this.bouncedFunc.stop();

            jasmine.Clock.tick(1000);
            expect(this.original).not.toHaveBeenCalled();

            this.bouncedFunc.resume();

            this.bouncedFunc();
            this.bouncedFunc();

            expect(this.original).not.toHaveBeenCalled();

            jasmine.Clock.tick(200);
            expect(this.original).toHaveBeenCalled();
        });
    });
});
