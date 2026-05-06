
const NoDataInbox = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[100%] w-full text-center px-4">
      <div className="max-w-[400px] flex flex-col gap-2">
        <h2 className="text-[#EAF0FF] text-[16px] font-sora">
          No Chats Found
        </h2>
        <span className="text-[#EAF0FF] text-[14px]">
          Invite your friends and start conversation with them
        </span>
      </div>
    </div>
  );
};

export default NoDataInbox;
