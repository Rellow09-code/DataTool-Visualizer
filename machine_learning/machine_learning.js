const my_file_input = document.querySelector('input[type="file"]')
const table_head = document.querySelector('thead')
const table_body = document.querySelector('tbody')
const output = document.querySelector('p')
let year_element = document.getElementById('year')
let month_element = document.getElementById('month')
let target_col = document.getElementById('target_column')
let my_csv;
let table_matrix = []
let table_rows = []
let table_cols = []
let my_table;

//table controls
let filtering_col = 6;
//dates
const date_YYYYMMDD = /^(19|20)\d\d[-\/.](0[1-9]|[1-9]|1[0-2])[-\/.](0[1-9]|[1-9]|[12][0-9]|3[01])$/
const date_DDMMYYYY = /^(0[1-9]|[1-9]|[12][0-9]|3[01])[-\/.](0[1-9]|[1-9]|1[0-2])[-\/.](19|20)\d\d$/

// Define regexes ONCE
const NUMBERS = /[+-]?\d+(\.\d+)?([eE][+-]?\d+)?/
const INTEGER_POSITIVE = /^\+?\d+$/;
const BLANK = /^\s*$/;
const INTEGER_SIGNED = /^-?\d+$/;
const DECIMAL = /^-?\d+(\.\d+)?$/;
const CURRENCY = /^\$?\d{1,3}(,\d{3})*(\.\d{2})?$/;
const EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE = /^\+?\d{0,3}?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STRICT_DATE = /^(19|20)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const BOOLEAN = /^(true|false|yes|no|1|0)$/i;
const ALPHA = /^[A-Za-z\s]+$/;
const ALPHANUM = /^[\w\s-]+$/;
const TRIM_WS = /^\s+|\s+$/;
const MULTI_COMMA = /,{2,}/;

// Reuse SAME instances
const regex_to_check = [
  INTEGER_POSITIVE,
  BLANK,
  INTEGER_SIGNED,
  DECIMAL,
  CURRENCY,
  EMAIL,
  PHONE,
  DATE,
  STRICT_DATE,
  TIME,
  BOOLEAN,
  ALPHA,
  ALPHANUM,
  TRIM_WS,
  MULTI_COMMA
];

const regexDescriptions = new Map([
  [INTEGER_POSITIVE, "Integer (positive)"],
  [BLANK, "Blank / empty cell"],
  [INTEGER_SIGNED, "Integer (positive or negative)"],
  [DECIMAL, "Decimal / float (positive or negative)"],
  [CURRENCY, "Currency / money format"],
  [EMAIL, "Email address"],
  [PHONE, "Phone number"],
  [DATE, "Date YYYY-MM-DD"],
  [STRICT_DATE, "Strict Date YYYY-MM-DD"],
  [TIME, "Time HH:MM or HH:MM:SS"],
  [BOOLEAN, "Boolean / yes-no"],
  [ALPHA, "Alphabetic text (letters only)"],
  [ALPHANUM, "Alphanumeric text with spaces / hyphens"],
  [TRIM_WS, "Leading or trailing whitespace"],
  [MULTI_COMMA, "Multiple consecutive commas / possible CSV error"]
]);

function add_column_control(){
    for (let col=0; col<table_cols[0].length; col++){
        table_cols[0][col].addEventListener('click',()=>trigger_column_menu())
    }
}

function alert_numeric_cols(){
    for (let col=0; col<table_matrix[0].length; col++){
        let numeric = true
        for (let row=1; row<table_matrix.length; row++){
            if (/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(table_matrix[row][col])){
                continue
            }
            numeric = false;
            break
        }
        if (numeric){
            table_cols[0][col].setAttribute('title',`Numeric column`)
        }
    }
}

function report(element,text,color){
    element.style.color = color
    element.innerHTML = text
}

function make_table_matrix(text){
    const result = Papa.parse(text, {
        skipEmptyLines: true
    });

    table_matrix = result.data;
    return table_matrix;
}

function verify_structure(){
    if (!table_matrix.length){
        report(output,'Upload a csv file', 'red')
        return
    }
    table_matrix_to_html()
    let col_size = table_matrix[0].length;
    let issues = false;
    for (let i=1; i<table_matrix.length; i++){
        if (table_matrix[i].length != col_size){
            report(output,'Invalid csv structure, check the row highlighted in red below', 'red')
            table_rows[i].setAttribute('title',`This row has ${table_matrix[i].length} columns, instead of ${col_size} columns`)
            table_rows[i].style.backgroundColor = 'rgba(255, 0, 0, 0.36)'
            issues = true;
        }
    }
    if (!issues){
        report(output,'Perfect csv structure', 'green')
    }
}

function check_duplicates(){
    if (!table_matrix.length){
        report(output,'Upload a csv file', 'red')
        return
    }
    table_matrix_to_html()
    //for each row, check against all others
    let found = false;
    for (let i=0; i<table_matrix.length; i++){
        for (let j=1; j<table_matrix.length; j++){
            if (i==j){continue}
            //for each column, check for duplication
            let dup = true
            for (let k=0; k<table_matrix[0].length; k++){
                if (table_matrix[i][k] != table_matrix[j][k]){
                    dup = false
                }
            }
            if (dup){
                report(output, `Duplicates found, check red rows below`,'red')
                table_rows[i].style.backgroundColor = 'rgba(255, 0, 0, 0.36)'
                table_rows[j].style.backgroundColor = 'rgba(255, 0, 0, 0.36)'
                //add info log
                table_rows[i].setAttribute('title',`This table is a duplicate to row ${j}`)
                table_rows[j].setAttribute('title',`This table is a duplicate to row ${i}`)
                found = true;
            }
        }
    }
    if (!found){
        report(output, `No duplicates found ✅`, 'green')
    }
}

function check_missing_values(){
    if (!table_matrix.length){
        report(output,'Upload a csv file', 'red')
        return
    }
    table_matrix_to_html()
    let found = false;
    for (let i=1; i<table_matrix.length; i++){
        for (let j=0; j<table_matrix[0].length; j++){
            if (/^\s*$/.test(table_matrix[i][j])){
                report(output,`Missing values found, check red rows below`,'red')
                table_rows[i].style.backgroundColor = 'rgba(255, 0, 0, 0.36)'
                table_cols[i][j].style.backgroundColor = 'rgba(255, 0, 0, 0.5)'
                //set description
                table_rows[i].setAttribute('title',`this row has a blank entry`)
                table_cols[i][j].setAttribute('title',`blank entry`)
                found =true;
            }
        }
    }
    if (!found){
        report(output, `No missing entries found ✅`, 'green')
    }
}

function table_matrix_to_html(t_matrix=null){
    if (!t_matrix){
        t_matrix = table_matrix
    }
    
    table_rows = [];
    table_cols = [];
    table_head.innerHTML = '';
    table_body.innerHTML = '';
    const tr = document.createElement('tr')
    table_cols.push([])
    for (let i=0; i<t_matrix[0].length; i++){
        const th = document.createElement('th');
        th.innerHTML = t_matrix[0][i];
        tr.appendChild(th)
        table_cols[0].push(th)
    }
    table_head.append(tr);
    table_rows.push(tr)
    

    for (let row=1; row<t_matrix.length; row++){
        const tr = document.createElement('tr')
        table_cols.push([])
        for (let col=0; col<t_matrix[row].length; col++){
            const td = document.createElement('td');
            td.innerHTML = t_matrix[row][col];
            if (row%2==0){
                td.style.backgroundColor = 'rgba(0, 0, 0, 0.075)'
            }
            tr.appendChild(td)
            table_cols[row].push(td)
        }
        table_body.append(tr)
        table_rows.push(tr)
    }
}

function regex_occurence(regex,column,faulty_cols){
    let total = 0;
    let occurence = 0;
    let potential_cols = []
    for (let i=1; i<table_matrix.length; i++){
        total+=1;
        if (regex.test(table_matrix[i][column])){
            occurence += 1
        }
        else{
            potential_cols.push([i,column])
        }
    }
    let results = occurence/total
    if (results>0.7 && results<1){
        potential_cols.forEach(element => {
            faulty_cols.push(element)
        });
    }
    return results
}

function add_row(data_list=[NaN],backgroundColor = 'white'){
    const tr = document.createElement('tr')
    for (let data of data_list){
        const td = document.createElement('td')
        td.innerHTML = data;
        tr.appendChild(td)
    }
    tr.style.backgroundColor = backgroundColor
    table_body.appendChild(tr)
}
//statistics section
function get_col_sum(col = 0,matrix=null){
    if (!matrix){
        matrix = table_matrix
    }
    let sum = 0;
    for (let row=1; row<matrix.length; row++){
        sum += Number(matrix[row][col])
    }
    return sum
}

function get_col_mean(col = 0){
    let sum = get_col_sum(col)
    return sum/(table_matrix.length-1)
}

function get_col_std_deviation(col = 0){
    let numerator = 0
    let mean = get_col_mean(col)
    for (let row=1; row<table_matrix.length; row++){
        let data = Number(table_matrix[row][col])
        numerator += Math.pow(data-mean,2)
    }
    const fraction = numerator/(table_matrix.length-2)
    return Math.sqrt(fraction)
}

function show_incosistency(){
    table_matrix_to_html()
    if (!table_matrix.length){
        report(output,'Upload a csv file', 'red')
        return
    }
    let found = false;
    let faulty_cols = []
    for (let i=0; i<regex_to_check.length; i++){
        for (let col=1; col<table_matrix[0].length; col++){
            let stats = regex_occurence(regex_to_check[i],col,faulty_cols)
            if (stats>0.70 && stats<1){
                //the whole column reports
                found = true;
                for (let k=0; k<table_matrix.length; k++){
                    table_cols[k][col].style.backgroundColor = 'rgba(255, 0, 0, 0.5)'
                    table_cols[k][col].setAttribute('title',`This column has inconsistent entries`)
                }
            }
        }
    }
    //hightlight the faulty columns
    for (let i=0; i<faulty_cols.length; i++){
        const [row,col] = faulty_cols[i]
        table_cols[row][col].style.backgroundColor = 'rgba(255, 0, 0, 0.75)'
        table_cols[row][col].setAttribute('title',`The format of this entry deviates from the majority of entries in this column`)
    }
    if (!found){
        report(output, `No abnormal entries found ✅`, 'green')
    }
    else{
        report(output, `Abnormal entries found`, 'red')
    }
}

my_file_input.addEventListener('change',(e)=>{
    const file = e.target.files[0];
    const reader = new FileReader()
    reader.onload = ()=>{
        my_table = new Table(reader.result)
        my_table.show_table()
    }
    reader.readAsText(file)
    report(output, `Upload successful ✅`, 'black')
})

function show_sum(clear=true, matrix=null){
    if (!matrix){matrix = table_matrix}
    if (clear){
        reset()
    }
    const sum = []
    for (let col=0; col<matrix[0].length; col++){
        sum.push(get_col_sum(col,matrix)||' ')
    }
    sum.push('Sum')
    const color = 'rgba(104, 253, 151, 0.25)'
    add_row(sum,color)
}

function show_mean(clear=true){
    if (clear){
        reset()
    }
    const mean = []
    for (let col=0; col<table_matrix[0].length; col++){
        mean.push(get_col_mean(col)||' ')
    }
    mean.push('Mean')
    const color = 'rgba(98, 255, 203, 0.25)'
    add_row(mean,color)
}

function show_std_deviation(clear=true){
    if (clear){
        reset()
    }
    const std_dev = []
    for (let col=0; col<table_matrix[0].length; col++){
        std_dev.push(get_col_std_deviation(col)||' ')
    }
    std_dev.push('Standard Deviation')
    const color = 'rgba(65, 248, 190, 0.25)'
    add_row(std_dev,color)
}

function show_stats(){
    reset()
    show_sum(false)
    show_mean(false)
    show_std_deviation(false)
}

function reset(){
    table_matrix_to_html()
}
my_csv = 
`id,name,age,gender,income,city,signup_date
1,Alice,29,Female,55000,New York,15-01-2023
2,Bob,34,Male,62000,Los Angeles,17-01-2023
2,Bob,34,Male,62000,Los Angeles,20-01-2023
2,Bob,34,Male,62000,Los Angeles,17-02-2023
3,Charlie,-89.90,male,580,New York,20-03-2023
4,Diana,+45,FEMALE,13,Chicago,21-05-2023,
5,Diana,+45,FEMALE,3,Chicago,22-05-2023`
//------------------------------------------------------------------------------------------

class Text{
    constructor(text='N/A'){
        this.text = text
        this.tag = [document.createElement('p')]
    }
    test(text){
        return true
    }
    get_value(){
        return this.text
    }
    get_html(){
        let curr = this.tag[0]
        curr.innerHTML = this.text;

        for (let i=1; i<this.tag.length; i++){
            this.tag[i].appendChild(curr)
            curr = this.tag[i]
        }
        return curr;
    }
    set_text(text){
       this.text = text 
    }
    add_html(tag){
        this.tag.push(document.createElement(tag))
        console.log(this.tag)
    }

    greater_than(other_text){
        return this.get_value() > other_text.get_value()
    }
    equals_to(other_text){
        return this.get_value() == other_text.get_value()
    }
    less_than(other_text){
        return this.get_value() < other_text.get_value()
    }
    
}

class MyDate extends Text{
    constructor(date='2023-02-21'){
        super();
        this.day = 1
        this.month = 1
        this.year = 2023
        this.set_date(date)
    }
    test(date){
        return date_DDMMYYYY.test(date) || date_YYYYMMDD.test(date)
    }
    set_date(date){
        let my_arr = date.split(/[-/.]/);
        if (!this.test(date)){
            report(output,'Invalid date found','Red')
            alert("Invalid date")
            return
        }

        if(my_arr[0].length==4){
            //begins with year
            this.year = Number(my_arr[0]);
            this.month = Number(my_arr[1]);
            this.day = Number(my_arr[2])
        }
        else{
            //begins with day
            this.day = Number(my_arr[0]);
            this.month = Number(my_arr[1]);
            this.year = Number(my_arr[2])
        }

    }
    get_value(){
        let my_year = `${this.year}`
        let my_month = `${this.month}`
        let my_day = `${this.day}`
        if (`${this.month}`.length == 1){
            my_month = `0`+my_month
        }
        if (`${this.day}`.length == 1){
            my_day = `0`+my_day
        }
        return `${my_year}/${my_month}/${my_day}`
    }
    greater_than(date){
        if (this.year > date.year){
            return true
        }
        else if (this.month > date.month){
            return true
        }
        else if (this.day > date.day){
            return true
        }
        return false
    }
    equals_to(date){
        if (this.year == date.year &&this.month == date.month &&this.day == date.day){
            return true
        }
        return false
    }
    less_than(date){
        if (this.year < date.year){
            return true
        }
        else if (this.month < date.month){
            return true
        }
        else if (this.day < date.day){
            return true
        }
        return false
    }

    //extras
    same_year(date){
        return date.year == this.year
    }
    same_month(date){
        return date.year == this.year && date.month == this.month
    }
    same_day(date){
        return date.year == this.year && date.month == this.month && date.day == this.day 
    }
}
class MyNumber extends Text{
    constructor(number=0){
        super()
        this.number = 0
        this.set_number(number)
    }
    test(number){//tests for its kind
        return NUMBERS.test(number)
    }
    set_number(number){
        if (!this.test(number)){
            alert("Invalid number")
            return
        }
        this.number = Number(number)
    }
    get_value(){
        return `${this.number}`;
    }
    greater_than(other_number){
        return this.number > other_number.number
    }
    equals_to(other_number){
        return this.number == other_number.number
    }
    less_than(other_number){
        return this.number < other_number.number
    }

}

class Table{
    constructor(my_string){
        //all types must have default values
        //order from specific types to trivial types
        this.possible_types = [MyDate,MyNumber,Text] 
        this.string = my_string
        this.table = []
        this.column_types = this.possible_types //dummy types (for testing)
        this.table_matrix = make_table_matrix(my_string)
        this.build_table()
    }
    build_table(){
        this.set_column_types()
        this.add_table_headers()
        this.add_table_data()
        this.add_filter_options()
    }
    set_column_types(){
        this.column_types = [];
        for (let col=0; col<this.table_matrix[0].length; col++){
            for (let Type of this.possible_types){
                const my_type = new Type()
                if (this.test_column((value)=>my_type.test(value),col)){
                    this.column_types.push(Type)
                    break;
                }
            }
        }
    }
    show_table(){
        make_table_matrix(this.string)
        table_matrix_to_html();
        alert_numeric_cols()
        add_column_control()
    }
    
    test_column(call_back,column_number){
        for (let row=1; row<this.table_matrix.length; row++){
            if (call_back(table_matrix[row][column_number])){
                continue
            }
            return false
        }
        return true
    }
    add_table_headers(){
        this.table.push([])
        for (let j=0; j<this.table_matrix[0].length; j++){
            this.table[0].push(new Text(this.table_matrix[0][j]))
        }
    }
    add_table_data(){
        for (let row=1; row<this.table_matrix.length; row++){
            this.table.push([])
            for (let col=0; col<this.table_matrix[0].length; col++){
                let DataType = this.column_types[col]
                let data = new DataType(this.table_matrix[row][col])
                this.table[row].push(data)
            }
        }
    }
    filter_table_to_matrix(column_to_filter,data,method=null){
        if (!method){
            method = (data1,data2)=>{
                return data1.equals_to(data2)
            }
        }
        if (column_to_filter>=this.column_types.length){
            alert('Column does not exist')
            return
        }
        const matrix = [[]]
        //add headers
        for (let k=0; k<this.table[0].length; k++){
            matrix[0].push(this.table[0][k].get_value())
        }

        //add data
        let curr_row = 0;
        for (let row=1; row<this.table.length; row++){
            if (method(this.table[row][column_to_filter],data)){
                matrix.push([])
                curr_row +=1
                for (let col=0; col<this.table[0].length; col++){
                    matrix[curr_row].push(this.table[row][col].get_value())
                }
            }
        }
        //clean the matrix
        const final = []
        for (let row = 0; row<matrix.length; row++){
            if (matrix[row].length > 0){
                final.push(matrix[row])
            }
        }
        return final;
    }
    add_filter_options(){
        target_col.innerHTML = ''
        for (let i=0; i<this.table_matrix[0].length; i++){
            let option = document.createElement('option')
            option.innerHTML = this.table_matrix[0][i];
            option.value = i;
            target_col.appendChild(option)
        }
    }
}

function trigger_column_menu(){
    const menu = document.getElementById('column_menu')
    if (menu.style.display=='flex'){
        menu.style.display = 'none'
    }
    else{
        menu.style.display = 'flex'
    }
}



//-------------------------------------------------------------------------------------------



const temp=`id,name,age,gender,income,city,signup_date
1,Alice,29,Female,55000,New York,2023-01-15
2,Bob,34,Male,62000,Los Angeles,2023-01-17
3,Charlie,-89.90,male,58000,New York,2023-01-20
4,Diana,+45,FEMALE,3,Chicago,01-2023-54
5,Evan,-150,Male,72000,Chicago,2023-02-03
6,Frank,38,,68000,Los Angeles,
7,Alice,29,Female,55000,New York,2023-01-15
8,Grace,27,Female,51000,new york,2023-02-10, I'm a bad example
10,Hank,34,Male,62000,Los Angeles,2023-01-17
10,Hank,34,Male,62000,Los Angeles,2023-01-17
11,Jack,41,Male,not_available,Miami,2023-02-18
12,Kate,31e9,Female,63000, Miami ,2023-02-20
`
function upload_demo(){
    my_table = new Table(my_csv);
    my_table.show_table()
}

month_element.addEventListener('change',()=>filter_date())
year_element.addEventListener('change',()=>filter_date())
target_col.addEventListener('change',()=>{
    filtering_col = Number(target_col.value)
    console.log(table_matrix[0][filtering_col])
    filter_date()
})

function scroll_up(){
    //auto scrolling
    window.scrollTo({
    top: 0,
    behavior: 'smooth'
    });
}
function scroll_down(){
    //auto scrolling
    window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth'
    });
}

function filter_date(){
    const year = year_element.value || '2023'
    const month = month_element.value || '01'
    const day = '01'

    const my_date = `${year}-${month}-${day}`
    console.log(my_date)
    let date = new MyDate(my_date)
    let my_method = (date1,date2)=>date1.same_month(date2)

    let filtered_matrix = my_table.filter_table_to_matrix(filtering_col,date,my_method)
    console.log(filtered_matrix)
    table_matrix_to_html(filtered_matrix)
    show_sum(false,filtered_matrix)
    scroll_down()
}
