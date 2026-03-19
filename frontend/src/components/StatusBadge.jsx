import "../styles/status.css";

function StatusBadge({status}){

  let className="status";

  if(status==="completed") className+=" status-success";
  else if(status==="running") className+=" status-running";
  else if(status==="failed") className+=" status-error";
  else className+=" status-pending";

  return(

    <span className={className}>
      {status}
    </span>

  );

}

export default StatusBadge;