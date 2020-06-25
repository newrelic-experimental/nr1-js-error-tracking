import React from 'react';
import PropTypes from 'prop-types';

export default class LabelValue extends React.Component {
  static propTypes = {
    label: PropTypes.string,
    value: PropTypes.string
  };

  static defaultProps = {
    label: 'Label Value Component',
    value: ''
  };

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="lvRow">
        <div className="lvLabel">{this.props.label}</div>
        <div className="lvValue">{this.props.value}</div>
      </div>
    );
  }
}
