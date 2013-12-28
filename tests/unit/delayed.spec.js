
describe('Функция "delayed":', function() {

    beforeEach(function() {
        jasmine.Clock.useMock();

        this.original = jasmine.createSpy('"original func"');

        this.delayedFunc = this.original.delayed(100);
    });

    it('есть в прототипе Function', function() {
        expect(Function.prototype.delayed).toBeDefined();
        expect(typeof Function.prototype.delayed).toBe('function');
    });


    it('выполняется с отсрочкой', function() {
        this.delayedFunc();

        jasmine.Clock.tick(99);
        expect(this.original).not.toHaveBeenCalled();

        jasmine.Clock.tick(1000);
        expect(this.original).toHaveBeenCalled();
    });

    it('отсрочка выполняется один раз', function() {
        this.delayedFunc();

        jasmine.Clock.tick(1000);

        expect(this.original.callCount).toEqual(1);
    });

    it('правильно передаются аргументы', function() {
        this.delayedFunc('TEST ARG');

        jasmine.Clock.tick(101);

        expect(this.original).toHaveBeenCalled();
        expect(this.original).toHaveBeenCalledWith('TEST ARG');
    });

    it('отсроченая функция срабатывает столько раз сколько вызывалась', function() {
        this.delayedFunc();
        this.delayedFunc();
        this.delayedFunc();

        jasmine.Clock.tick(1000);

        expect(this.original.callCount).toEqual(3);
    });

    it('аргументы правильно передаются в отсроченную функцию', function() {
        var i;
        for (i = 0; i < 3; ++i) {
            this.delayedFunc(i);
        }

        jasmine.Clock.tick(1000);

        for (i = 0; i < 3; ++i) {
            expect(this.original.calls[i].args[0]).toBe(i);
        }
    });

    it('функция вызывается с правильным контекстом', function() {
        var obj = {
            original: jasmine.createSpy(),
            prop: 31
        };

        obj.delayed = obj.original.delayed(100);
        obj.delayed();

        jasmine.Clock.tick(200);

        expect(obj.original.mostRecentCall.object).toBe(obj);
    });

    it('контекст функции форсируется параметром', function() {
        var original = jasmine.createSpy();

        var bindObj = {
            prop: 31
        };

        var delayed = original.delayed(100, bindObj);
        delayed();

        jasmine.Clock.tick(200);

        expect(original.mostRecentCall.object).toBe(bindObj);
    });

    describe('reset функция', function() {

        it('предотвращает вызов', function() {
            this.delayedFunc();
            this.delayedFunc.reset();

            jasmine.Clock.tick(1000);

            expect(this.original).not.toHaveBeenCalled();
        });

        it('предотвращает вызов (асинхронный вариант)', function() {
            this.delayedFunc();

            jasmine.Clock.tick(50);
            this.delayedFunc.reset();

            jasmine.Clock.tick(1000);

            expect(this.original).not.toHaveBeenCalled();
        });

        it('предотвращает все вызовы (асинхронный вариант)', function() {
            for (var i = 0; i < 3; ++i) {
                this.delayedFunc();
                jasmine.Clock.tick(20);
            }

            this.delayedFunc.reset();

            jasmine.Clock.tick(1000);

            expect(this.original).not.toHaveBeenCalled();
        });

        it('вызывает оригинальную функцию при параметре "wakeup"', function() {
            this.delayedFunc();
            this.delayedFunc.reset(true);

            expect(this.original).toHaveBeenCalled();
        });

        it('вызывает оригинальную функцию при параметре "wakeup" (асинхронный вариант)', function() {
            this.delayedFunc();

            jasmine.Clock.tick(50);
            this.delayedFunc.reset(true);

            expect(this.original).toHaveBeenCalled();
        });

        it('вызывает только последнюю оригинальную функцию при параметре "wakeup" (асинхронный вариант)', function() {
            for (var i = 0; i < 3; ++i) {
                this.delayedFunc(i);
                jasmine.Clock.tick(20);
            }
            this.delayedFunc('final');
            this.delayedFunc.reset(true);

            expect(this.original).toHaveBeenCalledWith('final');
            expect(this.original.callCount).toBe(1);
        });

        it('вызывает все запросы при параметре "wakeup = all" в том же порядке, что и вызывались', function() {
            var i;
            for (i = 0; i < 3; ++i) {
                this.delayedFunc(i);
                jasmine.Clock.tick(20);
            }
            this.delayedFunc.reset('all');

            for (i = 0; i < 3; ++i) {
                expect(this.original.calls[i].args[0]).toBe(i);
            }

            expect(this.original.callCount).toBe(3);
        });

        it('не вызывает оригинальную функцию после остановки с "wakeup"', function() {
            for (var i = 0; i < 3; ++i) {
                this.delayedFunc(i);
                jasmine.Clock.tick(20);
            }
            this.delayedFunc.reset(true);

            // This .reset from Jasmine.spy
            this.original.reset();

            jasmine.Clock.tick(1000);
            expect(this.original).not.toHaveBeenCalled();
        });

        it('не вызывает оригинальную функцию при параметре "wakeup" если нету очереди', function() {
            this.delayedFunc();

            jasmine.Clock.tick(200);
            this.original.reset();

            this.delayedFunc.reset(true);

            expect(this.original).not.toHaveBeenCalled();
        });
    });
});
