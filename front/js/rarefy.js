const slowdown = 1000/60;

var rarefy = (cb) => {
    let data;
    let tmt={};
    let prevRuns={}

    const clr = id => clearTimeout(tmt[id]);
    
    const newCb = (..._data) => {
        const id = _data[0]?.id; 
        prevRun = prevRuns[id] || 0;
        if (prevRun + slowdown < Date.now()) {
            prevRuns[id] = Date.now();
            clr(id);
            cb(...(_data.length ? _data : data));
        } else {
            data = _data;
            clr(id)
            stt(id)
        }
    }

    const stt = id => {
        tmt[id] = setTimeout(newCb, slowdown);
    }
    
    return newCb;
}