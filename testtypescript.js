var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Dude = (function () {
    function Dude() {
    }
    Dude.prototype.test = function (val) {
        return 1;
    };
    return Dude;
})();

var Student = (function (_super) {
    __extends(Student, _super);
    function Student(firstname, middleinitial, lastname) {
        _super.call(this);
        this.firstname = firstname;
        this.middleinitial = middleinitial;
        this.lastname = lastname;
        this.fullname = firstname + " " + middleinitial + " " + lastname + this.test();
    }
    Student.prototype.test = function () {
        return _super.prototype.test.call(this, 1);
    };
    return Student;
})(Dude);

function greeter(person) {
    return "Hello " + person.firstname + " " + person.lastname;
}

var user = new Student("Earl", "T", "Jones");
document.getElementById("example").innerHTML = greeter(user) + "<br />" + user.fullname;
