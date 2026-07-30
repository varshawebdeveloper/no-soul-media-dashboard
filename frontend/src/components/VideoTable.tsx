import React, { useState } from 'react';
import type { VideoItem } from '../types';
import styles from './VideoTable.module.css';

interface VideoTableProps {
  videos: VideoItem[];
}

export const VideoTable: React.FC<VideoTableProps> = ({ videos }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentVideos = filteredVideos.slice(startIndex, startIndex + itemsPerPage);

  const handleExportCSV = () => {
    const headers = ['Title', 'Views', 'Likes', 'Comments', 'Published At'];
    const rows = filteredVideos.map((v) => [
      `"${v.title.replace(/"/g, '""')}"`,
      v.viewCount,
      v.likeCount,
      v.commentCount,
      `"${new Date(v.publishedAt).toLocaleDateString()}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `video-analytics-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(filteredVideos, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `video-analytics-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search videos..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.searchInput}
        />
        <div className={styles.exportButtons}>
          <button onClick={handleExportCSV} className={styles.exportBtn}>
            Export CSV
          </button>
          <button onClick={handleExportJSON} className={styles.exportBtn}>
            Export JSON
          </button>
        </div>
      </div>

      <div className={styles.responsiveWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Video</th>
              <th className={styles.textRight}>Views</th>
              <th className={styles.textRight}>Likes</th>
              <th className={styles.textRight}>Comments</th>
              <th>Published</th>
            </tr>
          </thead>
          <tbody>
            {currentVideos.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  No videos found
                </td>
              </tr>
            ) : (
              currentVideos.map((video) => (
                <tr key={video.id}>
                  <td className={styles.videoCell}>
                    <img src={video.thumbnailUrl} alt={video.title} className={styles.thumbnail} />
                    <span className={styles.videoTitle}>{video.title}</span>
                  </td>
                  <td className={`${styles.textRight} ${styles.tabularNum}`}>
                    {parseInt(video.viewCount, 10).toLocaleString()}
                  </td>
                  <td className={`${styles.textRight} ${styles.tabularNum}`}>
                    {parseInt(video.likeCount, 10).toLocaleString()}
                  </td>
                  <td className={`${styles.textRight} ${styles.tabularNum}`}>
                    {parseInt(video.commentCount, 10).toLocaleString()}
                  </td>
                  <td className={styles.dateCell}>{new Date(video.publishedAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className={styles.pageBtn}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className={styles.pageBtn}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
