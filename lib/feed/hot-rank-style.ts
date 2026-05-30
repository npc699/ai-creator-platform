/** 热点榜排名色块：与右侧「热点话题」侧栏一致，前三暖色递进，其余灰色。 */
export function getHotRankBadgeClass(rank: number) {
  switch (rank) {
    case 1:
      return "bg-red-500 text-white";
    case 2:
      return "bg-orange-400 text-white";
    case 3:
      return "bg-amber-400 text-white";
    default:
      return "bg-zinc-100 text-zinc-500";
  }
}
