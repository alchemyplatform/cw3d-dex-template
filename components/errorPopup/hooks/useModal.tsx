import { useState, useEffect } from "react";

export const useModal = (initialVisible = false, timeout = 3000) => {
	const [visible, setVisible] = useState(initialVisible);

	useEffect(() => {
		let timer: NodeJS.Timeout;

		if (visible) {
			timer = setTimeout(() => {
				setVisible(false);
			}, timeout);
		}

		return () => {
			clearTimeout(timer);
		};
	}, [visible, timeout]);

	const showModal = () => {
		setVisible(true);
	};

	return {
		visible,
		showModal,
	};
};
