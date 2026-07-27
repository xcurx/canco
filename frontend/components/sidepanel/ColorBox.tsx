const ColorBox = ({color, selected}:{color: string, selected?: boolean}) => {
    return (
        <div className={`w-5 h-5 rounded-md cursor-pointer ${selected ? "ring-2 ring-offset-2 ring-offset-black ring-white" : ""}`} style={{backgroundColor: color}} />
    )
}

export default ColorBox