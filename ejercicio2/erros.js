export class validationError extends Error {
    constructor(message) {
        super(message)
        this.name = 'validationError'
    }
}

export class error500 extends Error {
    constructor(message) {
        super(message)
        this.name = 'error500'
    }
}

export class error404 extends Error {
    constructor(message) {
        super(message)
        this.name = 'error404'
    }
}

export class connectionError extends Error {
    constructor(message) {
        super(message)
        this.name = 'connectionError'
    }
}