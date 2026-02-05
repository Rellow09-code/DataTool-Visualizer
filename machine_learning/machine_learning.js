const my_file_input = document.querySelector('input[type="file"]')
const table_head = document.querySelector('thead')
const table_body = document.querySelector('tbody')
const output = document.querySelector('p')
let table_matrix = []
let table_rows = []
let table_cols = []

// Define regexes ONCE
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
        else{
            table_cols[0][col].setAttribute('title',`Non Numeric column`)
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
    table_matrix_to_html();
    alert_numeric_cols()
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

function table_matrix_to_html(){
    table_rows = [];
    table_cols = [];
    table_head.innerHTML = '';
    table_body.innerHTML = '';
    const tr = document.createElement('tr')
    table_cols.push([])
    for (let i=0; i<table_matrix[0].length; i++){
        const th = document.createElement('th');
        th.innerHTML = table_matrix[0][i];
        tr.appendChild(th)
        table_cols[0].push(th)
    }
    table_head.append(tr);
    table_rows.push(tr)
    

    for (let row=1; row<table_matrix.length; row++){
        const tr = document.createElement('tr')
        table_cols.push([])
        for (let col=0; col<table_matrix[row].length; col++){
            const td = document.createElement('td');
            td.innerHTML = table_matrix[row][col];
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
function get_col_sum(col = 0){
    let sum = 0;
    for (let row=1; row<table_matrix.length; row++){
        sum += Number(table_matrix[row][col])
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
        make_table_matrix(reader.result)
    }
    reader.readAsText(file)
    report(output, `Upload successful ✅`, 'black')
})

function show_sum(clear=true){
    if (clear){
        reset()
    }
    const sum = []
    for (let col=0; col<table_matrix[0].length; col++){
        sum.push(get_col_sum(col)||' ')
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

const my_csv = 
`id,name,age,gender,income,city,signup_date
1,Alice,29,Female,55000,New York,2023-01-15
2,Bob,34,Male,62000,Los Angeles,2023-01-17
3,Charlie,-89.90,male,58000,New York,2023-01-20`
const other =
`4,Diana,+45,FEMALE,3,Chicago,01-2023-54
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
    make_table_matrix(my_csv)
}
