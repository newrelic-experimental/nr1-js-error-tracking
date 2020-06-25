import React from "react";

export default class LabelValue extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div className={"lvRow"}>
                <div className={"lvLabel"}>{this.props.label}</div>
                <div className={"lvValue"}>{this.props.value}</div>
            </div>
        )
    }
}