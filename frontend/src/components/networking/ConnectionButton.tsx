"use client";

import { Check, LoaderCircle, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAcceptConnectionRequestMutation,
  useCancelConnectionRequestMutation,
  useGetConnectionStatusQuery,
  useRejectConnectionRequestMutation,
  useRemoveConnectionMutation,
  useSendConnectionRequestMutation,
} from "@/redux/features/networking/networkingApi";
import type { ConnectionStatusData } from "@/types/networking.types";
import { getNetworkingErrorMessage } from "./networking.utils";

interface ConnectionButtonProps {
  userId: string;
  connectionId?: string;
  status?: ConnectionStatusData["status"];
  className?: string;
}

const buttonBase =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export default function ConnectionButton({
  userId,
  connectionId,
  status: statusOverride,
  className = "",
}: ConnectionButtonProps) {
  const [createdConnectionId, setCreatedConnectionId] = useState<string>();
  const { data, isLoading: isStatusLoading } = useGetConnectionStatusQuery(userId, {
    skip: Boolean(statusOverride),
  });
  const [sendRequest, sendRequestState] = useSendConnectionRequestMutation();
  const [acceptRequest, acceptRequestState] = useAcceptConnectionRequestMutation();
  const [rejectRequest, rejectRequestState] = useRejectConnectionRequestMutation();
  const [cancelRequest, cancelRequestState] = useCancelConnectionRequestMutation();
  const [removeConnection, removeConnectionState] = useRemoveConnectionMutation();

  const status = statusOverride ?? data?.data.status;
  const activeConnectionId = connectionId ?? createdConnectionId;
  const isMutating =
    sendRequestState.isLoading ||
    acceptRequestState.isLoading ||
    rejectRequestState.isLoading ||
    cancelRequestState.isLoading ||
    removeConnectionState.isLoading;

  const runAction = async <T extends { message: string }>(
    action: () => { unwrap: () => Promise<T> },
    fallbackError: string,
    onSuccess?: (response: T) => void
  ) => {
    try {
      const response = await action().unwrap();
      toast.success(response.message);
      onSuccess?.(response);
    } catch (error) {
      toast.error(getNetworkingErrorMessage(error, fallbackError));
    }
  };

  const loadingLabel = (
    <>
      <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
      Working…
    </>
  );

  if (isStatusLoading || !status) {
    return (
      <button
        type="button"
        disabled
        className={`${buttonBase} bg-gray-100 text-gray-500 ${className}`}
      >
        <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
        Loading
      </button>
    );
  }

  if (status === "none") {
    return (
      <button
        type="button"
        onClick={() =>
          runAction(
            () => sendRequest({ recipient: userId }),
            "Unable to send the connection request.",
            (response) => setCreatedConnectionId(response.data._id)
          )
        }
        disabled={isMutating}
        className={`${buttonBase} bg-blue-800 text-white hover:bg-blue-900 active:bg-blue-950 ${className}`}
      >
        {isMutating ? loadingLabel : <><UserPlus size={16} aria-hidden="true" />Connect</>}
      </button>
    );
  }

  if (status === "pending_received") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        <button
          type="button"
          onClick={() =>
            activeConnectionId &&
            runAction(
              () => acceptRequest({ connectionId: activeConnectionId }),
              "Unable to accept the connection request."
            )
          }
          disabled={isMutating || !activeConnectionId}
          className={`${buttonBase} bg-blue-800 text-white hover:bg-blue-900 active:bg-blue-950`}
        >
          {acceptRequestState.isLoading ? loadingLabel : <><Check size={16} aria-hidden="true" />Accept</>}
        </button>
        <button
          type="button"
          onClick={() =>
            activeConnectionId &&
            runAction(
              () => rejectRequest({ connectionId: activeConnectionId }),
              "Unable to decline the connection request."
            )
          }
          disabled={isMutating || !activeConnectionId}
          className={`${buttonBase} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100`}
        >
          {rejectRequestState.isLoading ? loadingLabel : <><X size={16} aria-hidden="true" />Reject</>}
        </button>
      </div>
    );
  }

  if (status === "pending_sent") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        <span className={`${buttonBase} border border-blue-100 bg-blue-50 text-blue-800`}>
          Request sent
        </span>
        {activeConnectionId && (
          <button
            type="button"
            onClick={() =>
              runAction(
                () => cancelRequest({ connectionId: activeConnectionId }),
                "Unable to cancel the connection request.",
                () => setCreatedConnectionId(undefined)
              )
            }
            disabled={isMutating}
            className={`${buttonBase} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100`}
          >
            {cancelRequestState.isLoading ? loadingLabel : "Cancel"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <span className={`${buttonBase} bg-emerald-50 text-emerald-700`}>
        <Check size={16} aria-hidden="true" />
        Connected
      </span>
      {activeConnectionId && (
        <button
          type="button"
          onClick={() =>
            runAction(
              () => removeConnection(activeConnectionId),
              "Unable to remove this connection.",
              () => setCreatedConnectionId(undefined)
            )
          }
          disabled={isMutating}
          className={`${buttonBase} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100`}
        >
          {removeConnectionState.isLoading ? loadingLabel : "Remove"}
        </button>
      )}
    </div>
  );
}
