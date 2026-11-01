class ScalarResult:
    def __init__(self, value):
        self._value = value

    def first(self):
        return self._value

    def all(self):
        return self._value


class Result:
    def __init__(self, value):
        self._value = value

    def scalars(self):
        return ScalarResult(self._value)


class FakeDB:
    def __init__(self, value=None, error=None):
        self.value = value
        self.error = error
        self.added = []
        self.added_all = []
        self.committed = False
        self.rolled_back = False
        self.refreshed = []

    async def execute(self, *_args, **_kwargs):
        if self.error:
            raise self.error
        return Result(self.value)

    def add(self, obj):
        self.added.append(obj)

    def add_all(self, rows):
        self.added_all.extend(rows)

    async def commit(self):
        if self.error:
            raise self.error
        self.committed = True

    async def rollback(self):
        self.rolled_back = True

    async def refresh(self, obj):
        self.refreshed.append(obj)
