import React, {Component} from 'react';
import ViewportFrame from './ViewportFrame.jsx';

/**
 * CSS-arranged peer views, without scene or page-mounting policy.
 *
 * @extends {Component<WorkspaceProps>}
 */
export default class Workspace extends Component {
	/**
	 * Call this method to render independently keyed view containers.
	 *
	 * @returns {React.ReactNode} - One or two peer views.
	 */
	render() {
		let viewCount = this.props.views.length;
		let views = this.props.views.map((viewport, index) => {
			let number = index + 1;
			let notFound = this.props.notFound && index === 0;
			return (
				<ViewportFrame
					key={viewport.id}
					viewport={viewport}
					number={number}
					text={this.props.text}
					pages={this.props.pages}
					notFound={notFound}
					onSelectPage={this.props.onSelectPage}
					onCloseView={this.props.onCloseView}
					onOpenSettings={this.props.onOpenSettings}
				/>
			);
		});
		return (
			<div className="workspace-views" data-view-count={viewCount}>
				{views}
			</div>
		);
	}
}
