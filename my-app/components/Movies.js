import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import { Card, Button } from "react-bootstrap";
import NoImg from "../public/no-img.jpg";
import SingleMovieModal from "./SingleMovieModal";

//receive ID and spread
function Movies(props) {
  const { movieID } = props;
  const [modalShow, setModalShow] = useState(false);
  const { data, error } = useSWR(`http://localhost:8080/api/movies/${movieID}`);
  return (
    <>
      <Card
        style={{
          display: "block",
          width: "auto",
          position: "relative",
          height: "100%",
        }}
      >
        <Card.Img
          height="70%"
          variant="top"
          src={data?.poster || NoImg.src}
          style={{ objectFit: "cover" }}
        />
        <Card.Body style={{ height: "30%", position: "relative" }}>
          <Card.Title>{data?.title || "N/A"}</Card.Title>
          <Button
            variant="primary"
            onClick={() => {
              setModalShow(true);
            }}
            style={{ position: "absolute", bottom: "1rem", right: "1rem" }}
          >
            <strong>Details</strong>
          </Button>
        </Card.Body>
      </Card>
      <br />
      {modalShow ? (
        <SingleMovieModal
          show={modalShow}
          onHide={() => setModalShow(false)}
          movieid={movieID}
        />
      ) : (
        <></>
      )}
    </>
  );
}

export default Movies;
