function shift_data(){
    for (let i=0; i<data.length-1; i++){
        data[i][0] = data[i+1][0]
        data[i][1] = data[i+1][1]
        data[i][2] = data[i+1][2]
        data[i][3] = data[i+1][3]
    }
    data[data.length-1][0] = data[data.length-2][1]
    data[data.length-1][1] = data[data.length-2][1]
    data[data.length-1][2] = data[data.length-2][1]
    data[data.length-1][3] = data[data.length-2][1]    
}

const candle_chart_description = new Node()
candle_chart_description.draw = (ctx)=>{
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.font = "32px Arial";
    ctx.fillText('5 Seconds chart (Random Pair)',c*2,c*2,width/2)
    ctx.restore()
}


const candles = new Node()
candles.draw = (ctx) => {
    ctx.save()
    const coords = createCoords()
    for (let i=1; i< data.length; i++){
        const x = coords[i-1][4]
        const y = coords[i-1][1]
        const h = coords[i][1]-coords[i-1][1]
        const w = coords[i][4]-coords[i-1][4]
        const high = coords[i][2]
        const low = coords[i][3]

        if (coords[i-1][1]>coords[i][1]){//h is negative (because of inverted y axis in canvas)
            ctx.fillStyle = 'lime'
            line(ctx,x+w/2,high,x+w/2,low)
        }
        else{//h is positive
            ctx.fillStyle = 'red'
            line(ctx,x+w/2,high,x+w/2,low)
        }
        
        fillRectangle(ctx,x,y,w,h)
        ctx.fillStyle = 'black'
        rectangle(ctx,x,y,w,h)
    }
    ctx.restore()
}
function candle_chart(ctx){
    const chart = new CompoundObject()
    const my_candles = candles
    const description = candle_chart_description

    chart.add(description)
    chart.add(my_candles)
    chart.draw(ctx)
}


let last_sec = 0
let magnitude = 0.05
function live_chart(ctx){
    const date = new Date()
    let curr = data.length-1;
    let seconds = date.getSeconds()
    
    if ((seconds%5==0) && (seconds!=last_sec)){
        last_sec = seconds
        shift_data()
    }
    
    data[curr][1] += random_number(magnitude,-magnitude,2)
    data[curr][2] = max([data[curr][1], data[curr][2]])
    data[curr][3] = min([data[curr][1], data[curr][3]])
    insert_to_data()
    candle_chart(ctx)
    requestAnimationFrame(()=>init_canvas(ctx))
}