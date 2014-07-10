class Dude {
    test(val: number): number {
        return 1;
    }
}

class Student extends Dude {
    fullname: string;
    constructor(public firstname, public middleinitial, public lastname) {
        super();
        this.fullname = firstname + " " + middleinitial + " " + lastname + this.test();
    }

    test(): number {
        return super.test(1);
    }
}

interface Person {
    firstname: string;
    lastname: string;
}

function greeter(person: Person) {
    return "Hello " + person.firstname + " " + person.lastname;
}

var user = new Student("Earl", "T", "Jones");
document.getElementById("example").innerHTML = greeter(user) + "<br />" + user.fullname;
