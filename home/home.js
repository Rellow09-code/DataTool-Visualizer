const number_count_element = document.getElementById('number_count')
const max_number_element = document.getElementById('max')
const min_number_element = document.getElementById('minimum')
const cummulative_element = document.getElementById('cummulative')
const rounding_element = document.getElementById('rounding')
const data_element = document.getElementById('data')
const canvas = document.getElementById('display')
const ctx = canvas.getContext('2d')
const width = canvas.width;
const height = canvas.height;

//grid settings
const tick_length = 10
const num_ticks = 20
const num_ticksX = 2*num_ticks
const c = 20 //init gap


let data = [];
let data_X = [];
let wicks = [];

const chart_map = {'scatter plot':0,'live candle chart':1,'candle chart':2}
let current_chart = 2;


function random_number(max,min,rounding = 2){
    let num = (min + Math.random()*(max-min)).toFixed(rounding)
    return parseFloat(num)
}

function insert_to_data(){
    if (data.length == 0){
        return;
    }

    total_string = `...`
    let start = data.length>=10?data.length-10:0
    for (let i=start; i<data.length; i++){
        console.log(i,' of ',data.length)
        if (current_chart==1 || current_chart==2){
            total_string = `${total_string}, [${data[i]}]`
        }
        else{
            total_string = `${total_string}, ${data[i]}`
        }
        
    }

    data_element.innerHTML = total_string
}

function init_canvas(ctx){
    ctx.fillStyle = 'white'
    fillRectangle(ctx, 0,0,width,height)
    draw_axis(ctx)
    if (current_chart == 0){
        scatter_plot(ctx)
    }
    else if(current_chart==1){
        live_chart(ctx)
    }
    else if (current_chart == 2){
        candle_chart(ctx)
    }
}

//primitive functions
/**
 * returns a number that is true for all elements
 */
function dominant_element(data=[],callback_function = (a,b)=>{return a>b}){
    let sigma = data[0]
    for (let i=1; i<data.length; i++){
        let truth = callback_function(data[i],sigma)
        if (truth){
            sigma = data[i]
        }
    }
    return sigma
}
function max(data=[]){
    let max_value = data[0]
    for (let value of data){
        if (value>max_value){
            max_value=value
        }
    }
    return max_value
}

function min(data=[]){
    let min_value = data[0]
    for (let value of data){
        if (value<min_value){
            min_value = value
        }
    }
    return min_value
}

function createCoords(){
    //projects the points to canvas chart, and returns the coordinates
    const coords = []

    if (current_chart == 0){
        let max_data = Math.floor(max(data)+1)
        let min_data = Math.floor(min(data))
        let max_dataX = Math.floor(max(data_X)+1)
        let min_dataX = Math.floor(min(data_X))

        let magnitude = max_data-min_data
        let magnitudeX = max_dataX-min_dataX
        const new_height = height-c
        const new_width = width-c
        for (let i=0; i<data.length; i++){
            const y_mag = max_data - data[i] //magnitude from the top
            const y = y_mag/magnitude * new_height
            
            const x_mag = max_dataX - data_X[i] //magnitude from the right
            const x = c + new_width - x_mag/magnitudeX * new_width
            coords.push([x,y])
        }
    }
    else if (current_chart==1 || current_chart==2){
        let max_data = Math.floor(1+dominant_element(data,(a,b)=>{return a[1]>b[1]})[1])
        let min_data = Math.floor(dominant_element(data,(a,b)=>{return a[1]<b[1]})[1])
        let max_dataX = Math.floor(max(data_X)+1)
        let min_dataX = Math.floor(min(data_X))

        let magnitude = max_data-min_data
        let magnitudeX = max_dataX-min_dataX
        const new_height = height-c
        const new_width = width-c
        for (let i=0; i<data.length; i++){
            //open
            const open_mag = max_data - data[i][0] //magnitude from the top
            const open = open_mag/magnitude * new_height
            //close
            const close_mag = max_data - data[i][1] //magnitude from the top
            const close = close_mag/magnitude * new_height
            //high
            const high_mag = max_data - data[i][2] //magnitude from the top
            const high = high_mag/magnitude * new_height
            //low
            const low_mag = max_data - data[i][3] //magnitude from the top
            const low = low_mag/magnitude * new_height
            //X-axis
            const x_mag = max_dataX - data_X[i] //magnitude from the right
            const x = c + new_width - x_mag/magnitudeX * new_width
            coords.push([open,close,high,low,x])
        }
    }
    return coords
}

function generate_data(){
    const count = parseFloat(number_count_element.value) || 10
    const my_max = parseFloat(max_number_element.value) || 1
    const my_min = parseFloat(min_number_element.value) || 0
    let rounding = 2
    let potential_value = parseInt(rounding_element.value)
    if (potential_value == 0 || potential_value){
        rounding = potential_value
    }

    const cummulative = cummulative_element.checked

    if (my_max<my_min){
        data_element.innerHTML = ' Maximum number can not be less than the minimum number '
        return
    }
    
    let sum = 0
    //reset data
    data = []
    data_X = []
    for (let i=0; i<count; i++){
        if (cummulative){
            sum += random_number(my_max,my_min,rounding)
            data.push(sum)
        }
        else{
            data.push(random_number(my_max,my_min,rounding))
        }
        data_X.push(i)
    }
    insert_to_data()
    init_canvas(ctx)
}
function generate_candles(){
    const count = parseFloat(number_count_element.value) || 100
    const my_max = parseFloat(max_number_element.value) || 1
    const my_min = parseFloat(min_number_element.value) || -1
    let rounding = 2
    let potential_value = parseInt(rounding_element.value)
    if (potential_value == 0 || potential_value){
        rounding = potential_value
    }

    const cummulative = cummulative_element.checked

    if (my_max<my_min){
        data_element.innerHTML = ' Maximum number can not be less than the minimum number '
        return
    }
    
    //reset data
    data = []
    data_X = []
    for (let i=0; i<count; i++){
        const open = i==0?0:data[i-1][1]
        const close = open + random_number(my_max,my_min,rounding)
        const high = max([close,open]) + min([Math.abs(random_number(my_max,my_min)),Math.abs(random_number(my_max,my_min))])/2
        const low = min([close,open]) - min([Math.abs(random_number(my_max,my_min)),Math.abs(random_number(my_max,my_min))])/2
        data.push([open,close,high,low])

        data_X.push(i)
    }
    insert_to_data()
    init_canvas(ctx)
}
//objects

const grid = new Node()
grid.draw = (ctx) => {
    ctx.save()
    ctx.lineWidth = 2
    ctx.fillStyle = 'black'
    //line axis
    line(ctx,c,0,c,height)
    line(ctx,0,height-c,width,height-c)

    //axis' ticks
    const new_height = height-c
    for (let i=0; i<num_ticks; i++){
        line(ctx,c,i*(new_height/num_ticks),c+tick_length,i*(new_height/num_ticks))
    }
    const new_width = width-c
    for (let i=0; i<num_ticksX; i++){
        line(ctx,c+i*(new_width/num_ticksX),new_height,c+i*(new_width/num_ticksX),new_height-tick_length)
    }
    ctx.restore()
}

const grid_label = new Node()
grid_label.draw = (ctx)=>{
    ctx.save()
    ctx.fillStyle = 'black'
    //axis' numbers
    //y-axis label
    const new_height = height-c
    let max_data;
    let min_data;
    if (current_chart==0){
        max_data = Math.floor(1+max(data))
        min_data = Math.floor(min(data))
    }
    else{
        max_data = Math.floor(1+dominant_element(data,(a,b)=>{return a[1]>b[1]})[1])
        min_data = Math.floor(dominant_element(data,(a,b)=>{return a[1]<b[1]})[1])
    }

    for (let i=0; i<num_ticks; i++){
        const num = (max_data - (i/num_ticks)*(max_data-min_data)).toFixed(2)
        ctx.fillText(`${num}`,0,i*(new_height/num_ticks)+c/3)
    }
    //x-axis label
    const new_width = width-c
    let max_dataX = Math.floor(max(data_X)+1)
    let min_dataX = Math.floor(min(data_X))

    for (let i=0; i<=num_ticksX; i++){
        const num = (min_dataX - (-i/num_ticksX)*(max_dataX-min_dataX)).toFixed(2)
        ctx.fillText(`${num}`,c/2+i*(new_width/num_ticksX),new_height+c/2)
    }

    ctx.restore()
}

const points = new Node()
points.draw = (ctx)=>{
    ctx.save()
    ctx.fillStyle = 'black'
    const my_coords = createCoords()
    for (let i=0; i<data.length; i++){
        const [x,y] = my_coords[i]
        fillCircle(ctx,x,y,3)
    }

    ctx.restore()
}

function draw_axis(ctx){ 
    const world = new CompoundObject()
    const my_grid = grid
    const my_grid_label = grid_label

    world.add(my_grid)
    world.add(my_grid_label)
    world.draw(ctx)
}

function scatter_plot(ctx){
    const chart = new CompoundObject()
    const my_points = points

    chart.add(my_points)
    chart.draw(ctx)
}


function generate(){
    const selectedChart = document.querySelector('input[name="chart"]:checked')?.value;
    current_chart = chart_map[selectedChart]
    if (current_chart == 0){
        generate_data()
    }
    else if(current_chart==1 || current_chart==2){
        generate_candles()
    }
}

generate()