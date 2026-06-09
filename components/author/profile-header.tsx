import { AuthorAvatar } from "./avatar";
import { AuthorProfileEditSection } from "./profile-edit";

type AuthorProfileHeaderProps = {
  name: string;
  image: string | null;
  bio: string | null;
  /** 当前登录用户访问自己的主页时可编辑资料 */
  isOwner?: boolean;
  ownerEditName?: string;
  ownerEditBio?: string;
};

/** 发布者主页资料区：大头像、昵称、简介与编辑入口。 */
export function AuthorProfileHeader({
  name,
  image,
  bio,
  isOwner = false,
  ownerEditName = "",
  ownerEditBio = "",
}: AuthorProfileHeaderProps) {
  return (
    <div className="flex items-start gap-4">
      <AuthorAvatar authorImage={image} authorName={name} size="lg" />
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-950">{name}</h1>
          {isOwner ? (
            <AuthorProfileEditSection
              initialBio={ownerEditBio}
              initialName={ownerEditName}
            />
          ) : null}
        </div>
        {bio ? (
          <p className="mt-2 text-sm leading-6 text-zinc-600">{bio}</p>
        ) : isOwner && !bio ? (
          <p className="mt-2 text-sm text-zinc-400">暂无简介</p>
        ) : null}
      </div>
    </div>
  );
}
