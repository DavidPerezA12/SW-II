const clone = (value) => JSON.parse(JSON.stringify(value));

const getValuesByPath = (document, path) => {
    const parts = path.split(".");

    return parts.reduce((values, part) => {
        return values.flatMap(value => {
            if (value === undefined || value === null) {
                return [];
            }

            const next = value[part];
            return Array.isArray(next) ? next : [next];
        });
    }, [document]).filter(value => value !== undefined);
};

const compareValues = (actual, expected) => {
    if (Array.isArray(actual)) {
        return actual.some(value => compareValues(value, expected));
    }

    if (expected instanceof RegExp) {
        return expected.test(String(actual));
    }

    if (expected && typeof expected === "object") {
        if (expected.$gte !== undefined) {
            return Number(actual) >= Number(expected.$gte);
        }

        if (expected.$regex !== undefined) {
            const regex = expected.$regex instanceof RegExp
                ? expected.$regex
                : new RegExp(expected.$regex, expected.$options || "");

            return regex.test(String(actual));
        }
    }

    return actual === expected;
};

const matchesFilter = (document, filter = {}) => {
    return Object.entries(filter).every(([field, expected]) => {
        if (field === "$or") {
            return expected.some(option => matchesFilter(document, option));
        }

        const values = getValuesByPath(document, field);
        return values.some(value => compareValues(value, expected));
    });
};

class InMemoryCursor {
    constructor(documents) {
        this.documents = documents;
        this.skipCount = 0;
        this.limitCount = undefined;
        this.sortOption = {};
    }

    skip(value) {
        this.skipCount = value;
        return this;
    }

    limit(value) {
        this.limitCount = value;
        return this;
    }

    sort(option) {
        this.sortOption = option || {};
        return this;
    }

    async toArray() {
        let result = [...this.documents];
        const [[sortField, direction] = []] = Object.entries(this.sortOption);

        if (sortField) {
            result.sort((a, b) => {
                const aValue = getValuesByPath(a, sortField)[0];
                const bValue = getValuesByPath(b, sortField)[0];

                if (aValue === bValue) {
                    return 0;
                }

                return aValue > bValue ? direction : -direction;
            });
        }

        result = result.slice(this.skipCount);

        if (this.limitCount !== undefined) {
            result = result.slice(0, this.limitCount);
        }

        return clone(result);
    }
}

class InMemoryCollection {
    constructor(documents) {
        this.documents = documents;
    }

    find(filter = {}) {
        return new InMemoryCursor(
            this.documents.filter(document => matchesFilter(document, filter))
        );
    }

    async findOne(filter = {}) {
        const document = this.documents.find(item => matchesFilter(item, filter));
        return document ? clone(document) : null;
    }

    async insertOne(document) {
        const inserted = { ...clone(document), _id: `test-${this.documents.length + 1}` };
        this.documents.push(inserted);

        return { insertedId: inserted._id };
    }

    async updateOne(filter, update) {
        const index = this.documents.findIndex(item => matchesFilter(item, filter));

        if (index === -1) {
            return { matchedCount: 0, modifiedCount: 0 };
        }

        this.documents[index] = {
            ...this.documents[index],
            ...clone(update.$set || {})
        };

        return { matchedCount: 1, modifiedCount: 1 };
    }

    async deleteOne(filter) {
        const index = this.documents.findIndex(item => matchesFilter(item, filter));

        if (index === -1) {
            return { deletedCount: 0 };
        }

        this.documents.splice(index, 1);
        return { deletedCount: 1 };
    }

    async countDocuments(filter = {}) {
        return this.documents.filter(document => matchesFilter(document, filter)).length;
    }
}

const createInMemoryDb = (fixtures) => {
    const collections = Object.fromEntries(
        Object.entries(fixtures).map(([name, documents]) => [name, clone(documents)])
    );

    return {
        collection(name) {
            if (!collections[name]) {
                collections[name] = [];
            }

            return new InMemoryCollection(collections[name]);
        }
    };
};

module.exports = {
    createInMemoryDb
};
