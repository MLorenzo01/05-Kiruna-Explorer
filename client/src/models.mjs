export class Stakeholder {
    constructor(id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;
    }
}

export class Connection {
    constructor(document, relationship) {
        this.document = document;
        this.relationship = relationship;
    }
}