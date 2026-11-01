import Link from "next/link";
import type { ReactNode } from "react";
import type { NetworkPerson } from "@/types/network.types";

interface Props {
  person: NetworkPerson;
  description: string;
  actions?: ReactNode;
}

const getInitials = (person: NetworkPerson) =>
  `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();

export default function NetworkPersonCard({
  person,
  description,
  actions,
}: Props) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary-200 hover:shadow-md sm:flex-row sm:items-center">
      <Link
        href={`/profile/${person._id}`}
        className="flex min-w-0 flex-1 items-center gap-4"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-50 text-lg font-semibold text-primary-800">
          {person.avatar ? (
            // Existing profile UI uses a standard img for remotely hosted avatars.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={person.avatar}
              alt={`${person.firstName} ${person.lastName}`}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitials(person)
          )}
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-slate-900">
            {person.firstName} {person.lastName}
          </h2>
          <p className="truncate text-sm text-slate-500">@{person.username}</p>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </Link>
      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          {actions}
        </div>
      )}
    </article>
  );
}
