interface ErrorPopupProps {
	message: string;
}

export const ErrorPopup: React.FC<ErrorPopupProps> = ({ message }) => {
	return (
		<div className="absolute bottom-2 right-1 p-2 bg-red-400 rounded-sm text-white min-w-1/6 h-28 rounded-s font-bold flex justify-center items-center transform transition-transform duration-300">
			<p>{message}</p>
		</div>
	);
};
