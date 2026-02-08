package repository

import (
	"fmt"
	"io"

	"github.com/nxadm/tail"
)

type LogReader struct {
	filePath string
	follow   bool
}

func NewLogReader(filePath string, follow bool) *LogReader {
	return &LogReader{filePath: filePath, follow: follow}

}

func (lr *LogReader) ReadLines() (<-chan string, <-chan error) {
	lines := make(chan string)
	errChan := make(chan error, 1)
	whence := io.SeekStart

	if lr.follow {
		whence = io.SeekEnd
	}

	config := tail.Config{
		Follow:    lr.follow,
		ReOpen:    lr.follow,
		Poll:      true,
		MustExist: false,
		Location:  &tail.SeekInfo{Offset: 0, Whence: whence},
	}

	t, err := tail.TailFile(lr.filePath, config)
	if err != nil {
		go func() {
			errChan <- fmt.Errorf("dosya kuyruğa alınamadı: %w", err)
			close(lines)
			close(errChan)
		}()
		return lines, errChan
	}

	go func() {
		defer close(lines)
		defer close(errChan)

		for line := range t.Lines {
			if line.Err != nil {
				errChan <- fmt.Errorf("satır okunurken hata oluştu: %w", line.Err)
				continue
			}
			lines <- line.Text
		}
	}()

	return lines, errChan
}
